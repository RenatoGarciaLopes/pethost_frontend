import { chromium } from "@playwright/test";

/**
 * Captura visual da tela de entrar para revisão humana (não é teste).
 * Uso: com o Next em http://localhost:3100, `node e2e/support/screenshot-login.mjs <pasta-de-saida>`.
 */
const out = process.argv[2] ?? "test-results/screens";
const base = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch();

const shots = [
  { name: "login-desktop", path: "/login", viewport: { width: 1440, height: 960 } },
  { name: "login-mobile", path: "/login", viewport: { width: 390, height: 844 } },
  { name: "login-host-desktop", path: "/login?as=host", viewport: { width: 1440, height: 960 } },
  { name: "admin-login-desktop", path: "/admin/login", viewport: { width: 1440, height: 960 } },
];

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.goto(`${base}${shot.path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/${shot.name}.png` });
  await page.close();
}

// Estado de erro: credencial errada contra o backend simulado.
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.getByLabel("E-mail").fill("tutora@pethost.test");
await page.getByLabel(/^Senha/).fill("errada");
await page.getByRole("button", { name: "Entrar" }).click();
await page.getByText(/não batem com essa conta/).waitFor();
await page.screenshot({ path: `${out}/login-error-desktop.png` });

// Campos vazios: validação no envio.
await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Entrar" }).click();
await page.screenshot({ path: `${out}/login-validation-desktop.png` });

await browser.close();
console.log("capturas em", out);
