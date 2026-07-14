import * as tls from "node:tls";
import {
  mapFrontendStatus,
  mapSslStatus,
  mapBackendStatus,
  mapDatabaseStatus,
  CheckStatus,
  BackendReportedStatus,
} from "./statusMapping";

export interface CheckOutcome {
  layer: "FRONTEND" | "BACKEND" | "DATABASE" | "SSL";
  status: CheckStatus;
  latencyMs: number | null;
  httpStatus: number | null;
  errorMessage: string | null;
}

const FRONTEND_TIMEOUT_MS = 10_000;
const BACKEND_TIMEOUT_MS = 10_000;
const TLS_TIMEOUT_MS = 8_000;

export async function runFrontendCheck(url: string): Promise<CheckOutcome> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FRONTEND_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const latencyMs = Date.now() - started;
    const status = mapFrontendStatus({
      httpStatus: res.status,
      latencyMs,
      timedOut: false,
      connectionError: false,
    });
    return {
      layer: "FRONTEND",
      status,
      latencyMs,
      httpStatus: res.status,
      errorMessage: status === "DOWN" ? `HTTP ${res.status}` : status === "DEGRADED" ? `slow response (${latencyMs}ms)` : null,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const timedOut = (err as { name?: string })?.name === "AbortError";
    const status = mapFrontendStatus({
      httpStatus: null,
      latencyMs,
      timedOut,
      connectionError: !timedOut,
    });
    return {
      layer: "FRONTEND",
      status,
      latencyMs,
      httpStatus: null,
      errorMessage: timedOut
        ? `timeout after ${FRONTEND_TIMEOUT_MS}ms`
        : String((err as Error)?.message ?? err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runSslCheck(url: string): Promise<CheckOutcome> {
  const started = Date.now();
  try {
    const { hostname } = new URL(url);
    const daysUntilExpiry = await readCertificateDaysUntilExpiry(hostname);
    const status = mapSslStatus({ daysUntilExpiry, expired: daysUntilExpiry < 0 });
    return {
      layer: "SSL",
      status,
      latencyMs: Date.now() - started,
      httpStatus: null,
      errorMessage:
        status === "DOWN" && daysUntilExpiry < 0
          ? `certificate expired ${Math.abs(daysUntilExpiry)} days ago`
          : status === "DEGRADED"
            ? `certificate expires in ${daysUntilExpiry} days`
            : null,
    };
  } catch (err) {
    return {
      layer: "SSL",
      status: mapSslStatus({ daysUntilExpiry: null, expired: false }),
      latencyMs: Date.now() - started,
      httpStatus: null,
      errorMessage: String((err as Error)?.message ?? err),
    };
  }
}

function readCertificateDaysUntilExpiry(hostname: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: TLS_TIMEOUT_MS },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          if (!cert || !cert.valid_to) {
            socket.end();
            reject(new Error("no certificate returned"));
            return;
          }
          const validTo = new Date(cert.valid_to).getTime();
          socket.end();
          resolve(Math.floor((validTo - Date.now()) / (1000 * 60 * 60 * 24)));
        } catch (e) {
          socket.end();
          reject(e);
        }
      }
    );
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`TLS connect timeout after ${TLS_TIMEOUT_MS}ms`));
    });
  });
}

interface HealthResponseBody {
  status?: BackendReportedStatus;
  checks?: Record<string, { status?: BackendReportedStatus; latency_ms?: number; error?: string }>;
  latency_ms?: number;
  version?: string;
}

export async function runBackendAndDatabaseChecks(
  healthUrl: string,
  authToken: string | null
): Promise<{ backend: CheckOutcome; database: CheckOutcome }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  let reachable = false;
  let reportedStatus: BackendReportedStatus | null = null;
  let dbReportedStatus: BackendReportedStatus | null = null;
  let httpStatus: number | null = null;
  let errorMessage: string | null = null;
  let latencyMs = 0;

  try {
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(healthUrl, { signal: controller.signal, headers });
    latencyMs = Date.now() - started;
    httpStatus = res.status;
    if (res.ok) {
      reachable = true;
      const body = (await res.json()) as HealthResponseBody;
      reportedStatus = body.status ?? null;
      dbReportedStatus = body.checks?.db?.status ?? null;
      if (reportedStatus === null) {
        errorMessage = "backend response missing status field";
      } else if (reportedStatus !== "ok") {
        errorMessage = body.checks?.db?.error ?? `backend reported status: ${reportedStatus}`;
      }
    } else {
      errorMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    latencyMs = Date.now() - started;
    errorMessage =
      (err as { name?: string })?.name === "AbortError"
        ? `timeout after ${BACKEND_TIMEOUT_MS}ms`
        : String((err as Error)?.message ?? err);
  } finally {
    clearTimeout(timer);
  }

  const backendStatus = mapBackendStatus({ reachable, reportedStatus });
  const dbResult = mapDatabaseStatus({ backendReachable: reachable, dbReportedStatus });

  return {
    backend: {
      layer: "BACKEND",
      status: backendStatus,
      latencyMs,
      httpStatus,
      errorMessage: backendStatus === "UP" ? null : errorMessage,
    },
    database: {
      layer: "DATABASE",
      status: dbResult.status,
      latencyMs: null,
      httpStatus: null,
      errorMessage: dbResult.errorMessage,
    },
  };
}
