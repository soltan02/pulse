export type CheckStatus = "UP" | "DEGRADED" | "DOWN";
export type BackendReportedStatus = "ok" | "degraded" | "error";

const DEGRADED_LATENCY_MS = 3000;
const SSL_DEGRADED_DAYS = 14;

export interface FrontendCheckInput {
  httpStatus: number | null; // null when the request never got a response
  latencyMs: number;
  timedOut: boolean;
  connectionError: boolean;
}

export function mapFrontendStatus(input: FrontendCheckInput): CheckStatus {
  if (input.timedOut || input.connectionError) return "DOWN";
  const status = input.httpStatus ?? 0;
  if (status >= 500 || status >= 400 || status === 0) return "DOWN";
  if (input.latencyMs > DEGRADED_LATENCY_MS) return "DEGRADED";
  return "UP";
}

export interface SslCheckInput {
  daysUntilExpiry: number | null; // null when the certificate couldn't be read at all
  expired: boolean;
}

export function mapSslStatus(input: SslCheckInput): CheckStatus {
  if (input.daysUntilExpiry === null) return "DOWN";
  if (input.expired) return "DOWN";
  if (input.daysUntilExpiry < SSL_DEGRADED_DAYS) return "DEGRADED";
  return "UP";
}

export interface BackendCheckInput {
  reachable: boolean; // false on timeout, connection error, or non-2xx
  reportedStatus: BackendReportedStatus | null; // null when unreachable or unparseable
}

export function mapBackendStatus(input: BackendCheckInput): CheckStatus {
  if (!input.reachable || input.reportedStatus === null) return "DOWN";
  if (input.reportedStatus === "ok") return "UP";
  if (input.reportedStatus === "degraded") return "DEGRADED";
  return "DOWN";
}

export interface DatabaseCheckInput {
  backendReachable: boolean;
  dbReportedStatus: BackendReportedStatus | null;
}

export interface DatabaseCheckResult {
  status: CheckStatus;
  errorMessage: string | null;
}

export function mapDatabaseStatus(input: DatabaseCheckInput): DatabaseCheckResult {
  if (!input.backendReachable) {
    return { status: "DOWN", errorMessage: "backend unreachable, db state unknown" };
  }
  if (input.dbReportedStatus === null) {
    return { status: "DOWN", errorMessage: "backend response did not include a db check" };
  }
  if (input.dbReportedStatus === "ok") return { status: "UP", errorMessage: null };
  if (input.dbReportedStatus === "degraded") return { status: "DEGRADED", errorMessage: null };
  return { status: "DOWN", errorMessage: null };
}
