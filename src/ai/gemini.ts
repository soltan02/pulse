import { Layer } from "@prisma/client";
import { config } from "../config";

const GEMINI_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 15_000;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export interface IncidentContext {
  siteName: string;
  siteUrl: string;
  layer: Layer;
  firstError: string;
  recentChecks: { status: string; latencyMs: number | null; errorMessage: string | null; timestamp: Date }[];
}

const SYSTEM_INSTRUCTION = `You are an expert site-reliability engineer helping a solo developer triage a website monitoring incident. You will be given the site, the layer that failed (FRONTEND, BACKEND, DATABASE, or SSL), the error, and recent check history. Respond in plain text only (no markdown headers, no code fences):

1. One short paragraph: your best guess at the root cause, reasoning from the error and the trend in recent checks (sudden vs gradual, intermittent vs persistent).
2. A numbered list of 2-4 specific, actionable next steps or alternative fixes, ranked most-likely-to-help first. Be concrete (mention things like connection pool exhaustion, cold starts, expired certs, DNS/CDN propagation, rate limits, database connection limits, or deployment rollback, as relevant) rather than generic advice like "check the logs".

Keep the whole response under 120 words — this will be read on a phone push notification.`;

/** Best-effort AI root-cause analysis, called once when an incident opens.
 *  Never throws — a failing/misconfigured/slow AI call must never block
 *  incident creation or alerting. Returns null if unavailable. */
export async function diagnoseIncident(ctx: IncidentContext): Promise<string | null> {
  if (!config.geminiApiKey) return null;

  const historyLines = ctx.recentChecks
    .map((c) => {
      const latency = c.latencyMs !== null ? ` (${c.latencyMs}ms)` : "";
      const error = c.errorMessage ? `: ${c.errorMessage}` : "";
      return `${c.timestamp.toISOString()} — ${c.status}${latency}${error}`;
    })
    .join("\n");

  const userPrompt = [
    `Site: ${ctx.siteName} (${ctx.siteUrl})`,
    `Failed layer: ${ctx.layer}`,
    `Error: ${ctx.firstError}`,
    "",
    "Recent check history (oldest first):",
    historyLines || "(no history available)",
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.geminiApiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          // thinkingBudget: 0 — this needs to be fast, and gemini-2.5-flash's
          // extended-thinking tokens otherwise eat the entire maxOutputTokens
          // budget before producing any visible text (observed: 382/400
          // tokens spent "thinking", response truncated to a few words).
          generationConfig: { temperature: 0.3, maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    if (!res.ok) {
      console.error(`Gemini diagnosis failed: HTTP ${res.status} ${await res.text().catch(() => "")}`);
      return null;
    }

    const body = (await res.json()) as GeminiResponse;
    const text = body.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.error("Gemini diagnosis threw:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
