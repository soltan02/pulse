import { config } from "../config";

export interface EmailAlertPayload {
  event: "opened" | "resolved";
  site: string;
  layer: string;
  error: string;
  startedAt: string;
  incidentId: string;
  aiDiagnosis: string | null;
  dashboardLink: string;
}

export async function sendEmailAlert(payload: EmailAlertPayload): Promise<void> {
  if (!config.resendApiKey || !config.resendFromEmail) return;
  try {
    const verb = payload.event === "opened" ? "DOWN" : "RECOVERED";
    const subject = `Pulse: ${payload.site} ${payload.layer} is ${verb}`;
    const text = [
      `Site: ${payload.site}`,
      `Layer: ${payload.layer}`,
      `Status: ${verb}`,
      `Error: ${payload.error}`,
      `Started: ${payload.startedAt}`,
      ...(payload.aiDiagnosis ? [`\nAI Diagnosis:\n${payload.aiDiagnosis}`] : []),
      `\nDashboard: ${payload.dashboardLink}`,
    ].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.resendFromEmail,
        to: [config.resendFromEmail], // Send to self for now; customize as needed
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`Resend email failed: HTTP ${res.status} ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.error("Resend email threw:", err);
  }
}
