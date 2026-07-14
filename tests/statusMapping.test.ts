import { describe, it, expect } from "vitest";
import {
  mapFrontendStatus,
  mapSslStatus,
  mapBackendStatus,
  mapDatabaseStatus,
} from "../src/worker/statusMapping";

describe("mapFrontendStatus", () => {
  it("is UP for a fast 2xx response", () => {
    expect(
      mapFrontendStatus({ httpStatus: 200, latencyMs: 120, timedOut: false, connectionError: false })
    ).toBe("UP");
  });

  it("is UP for a fast 3xx response", () => {
    expect(
      mapFrontendStatus({ httpStatus: 301, latencyMs: 80, timedOut: false, connectionError: false })
    ).toBe("UP");
  });

  it("is DEGRADED when latency exceeds 3000ms even on 2xx", () => {
    expect(
      mapFrontendStatus({ httpStatus: 200, latencyMs: 3500, timedOut: false, connectionError: false })
    ).toBe("DEGRADED");
  });

  it("is DOWN on timeout", () => {
    expect(
      mapFrontendStatus({ httpStatus: null, latencyMs: 10000, timedOut: true, connectionError: false })
    ).toBe("DOWN");
  });

  it("is DOWN on connection error", () => {
    expect(
      mapFrontendStatus({ httpStatus: null, latencyMs: 0, timedOut: false, connectionError: true })
    ).toBe("DOWN");
  });

  it("is DOWN on 5xx regardless of latency", () => {
    expect(
      mapFrontendStatus({ httpStatus: 503, latencyMs: 50, timedOut: false, connectionError: false })
    ).toBe("DOWN");
  });

  it("is DOWN on 4xx", () => {
    expect(
      mapFrontendStatus({ httpStatus: 404, latencyMs: 50, timedOut: false, connectionError: false })
    ).toBe("DOWN");
  });
});

describe("mapSslStatus", () => {
  it("is UP with plenty of days left", () => {
    expect(mapSslStatus({ daysUntilExpiry: 90, expired: false })).toBe("UP");
  });

  it("is DEGRADED under 14 days left", () => {
    expect(mapSslStatus({ daysUntilExpiry: 13, expired: false })).toBe("DEGRADED");
  });

  it("is UP at exactly 14 days left", () => {
    expect(mapSslStatus({ daysUntilExpiry: 14, expired: false })).toBe("UP");
  });

  it("is DOWN when expired", () => {
    expect(mapSslStatus({ daysUntilExpiry: -1, expired: true })).toBe("DOWN");
  });

  it("is DOWN when the certificate can't be read", () => {
    expect(mapSslStatus({ daysUntilExpiry: null, expired: false })).toBe("DOWN");
  });
});

describe("mapBackendStatus", () => {
  it("is UP when reachable and reports ok", () => {
    expect(mapBackendStatus({ reachable: true, reportedStatus: "ok" })).toBe("UP");
  });

  it("is DEGRADED when reachable and reports degraded", () => {
    expect(mapBackendStatus({ reachable: true, reportedStatus: "degraded" })).toBe("DEGRADED");
  });

  it("is DOWN when reachable but reports error", () => {
    expect(mapBackendStatus({ reachable: true, reportedStatus: "error" })).toBe("DOWN");
  });

  it("is DOWN on timeout/non-2xx (unreachable)", () => {
    expect(mapBackendStatus({ reachable: false, reportedStatus: null })).toBe("DOWN");
  });
});

describe("mapDatabaseStatus", () => {
  it("is UP when backend reports db ok", () => {
    expect(mapDatabaseStatus({ backendReachable: true, dbReportedStatus: "ok" })).toEqual({
      status: "UP",
      errorMessage: null,
    });
  });

  it("is DEGRADED when backend reports db degraded", () => {
    expect(mapDatabaseStatus({ backendReachable: true, dbReportedStatus: "degraded" })).toEqual({
      status: "DEGRADED",
      errorMessage: null,
    });
  });

  it("is DOWN when backend reports db error", () => {
    expect(mapDatabaseStatus({ backendReachable: true, dbReportedStatus: "error" })).toEqual({
      status: "DOWN",
      errorMessage: null,
    });
  });

  it("is DOWN with a specific message when the backend itself is unreachable", () => {
    expect(mapDatabaseStatus({ backendReachable: false, dbReportedStatus: null })).toEqual({
      status: "DOWN",
      errorMessage: "backend unreachable, db state unknown",
    });
  });
});
