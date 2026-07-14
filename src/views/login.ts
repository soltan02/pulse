import { layout } from "./layout";

export function renderLoginPage(opts: { error?: boolean } = {}): string {
  const body = `
<div class="login-wrap">
  <div class="card" style="width:320px;">
    <h2 style="margin-top:0;">Pulse</h2>
    ${opts.error ? '<p style="color: var(--down); font-size: 14px;">Wrong password.</p>' : ""}
    <form class="stacked" method="post" action="/login">
      <label>Password<input type="password" name="password" required autofocus /></label>
      <button type="submit">Log in</button>
    </form>
  </div>
</div>`;
  return layout("Log in", body, { authed: false });
}
