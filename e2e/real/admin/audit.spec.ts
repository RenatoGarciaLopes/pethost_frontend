import { expect, test } from "@playwright/test";

test("REQ-AUDIT-001 admin consulta a própria ação de busca na API real", async ({ page, baseURL }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Configure uma conta administrativa descartável do ambiente de teste.");
  const headers = { origin: baseURL!, "x-pethost-request": "1" };
  const login = await page.request.post("/api/auth/sessions/login", {
    headers,
    data: { email, password, role: "admin" },
  });
  expect(login.ok()).toBe(true);
  await page.goto("/admin/audit-entries?action=audit.searched");
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir detalhes: Busca na auditoria/ }).first()).toBeVisible();
});
