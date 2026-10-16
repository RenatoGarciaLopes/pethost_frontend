import { expect, test } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.setTimeout(60_000);

test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "admin", "admin");
});
test.afterEach(async ({ page }) => resetAccountMock(page));

test("REQ-AACC-001/003/005/007/008/009 tutor encontra conta, suspende e libera CPF sem busca na URL", async ({
  page,
}) => {
  await page.goto("/admin/users?type=owners");
  const search = page.getByRole("textbox", { name: "Buscar por nome, e-mail ou CPF" });
  await waitForHydration(search);
  await search.fill("529.982.247-25");
  await expect(page).toHaveURL(/type=owners/);
  await expect(page).not.toHaveURL(/529/);
  await page.getByRole("link", { name: "João de teste", exact: true }).click();

  await expect(page.getByRole("heading", { name: "João de teste" })).toBeVisible();
  await expect(page.getByText("***.***.***-25")).toBeVisible();
  const suspend = page.getByRole("button", { name: "Suspender conta" });
  await waitForHydration(suspend);
  await suspend.click();
  const suspension = page.getByRole("dialog", { name: "Suspender conta" });
  await expect(suspension).toContainText("A pessoa sai na hora e não entra com a senha");
  await suspension.getByRole("textbox", { name: "Motivo" }).fill("Disputa documental conferida no cenário de teste.");
  await suspension.getByRole("button", { name: "Suspender conta" }).click();
  await expect(page.getByText("Conta suspensa.")).toBeVisible();
  await expect(page.getByText("Suspensa", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Liberar CPF" }).click();
  const release = page.getByRole("dialog", { name: "Liberar CPF" });
  await release.getByRole("textbox", { name: "Motivo" }).fill("Titularidade confirmada.");
  const word = release.getByRole("textbox", { name: "Digite LIBERAR para confirmar" });
  await word.fill("liberar");
  await expect(release.getByRole("button", { name: "Liberar CPF" })).toBeDisabled();
  await word.fill("LIBERAR");
  await release.getByRole("button", { name: "Liberar CPF" }).click();
  await expect(page.getByText("Identidade liberada. Essa conta não volta.")).toBeVisible();
  await expect(
    page.getByText("Essa identidade foi liberada. Essa conta não volta e a suspensão não pode ser retirada."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tirar suspensão" })).toHaveCount(0);
  const audit = page.getByRole("link", { name: "Ver na trilha" });
  await expect(audit).toHaveAttribute(
    "href",
    new RegExp(`targetType=owner.*targetId=${"0199d2a0-0000-7000-8000-000000003201"}`),
  );
  await expect(page.getByRole("link", { name: /Abrir detalhes: Tutor suspenso/ })).toBeVisible();
  await page.getByRole("link", { name: "Ver na trilha", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/admin/audit-entries\\?targetType=owner&targetId=${"0199d2a0-0000-7000-8000-000000003201"}`),
    { timeout: 15_000 },
  );
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir detalhes: Tutor suspenso/ })).toBeVisible();
});

test("REQ-AACC-014/015 anfitrião filtra Stripe na API e reinicia somente cadastro recusado", async ({ page }) => {
  await page.goto("/admin/users?type=hosts&stripeStatus=rejected");
  await expect(page.getByRole("combobox", { name: "Cadastro de recebimento" })).toHaveValue("rejected");
  await expect(page.getByRole("link", { name: "Dani Stripe recusado", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Dani Stripe recusado", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Dani Stripe recusado" })).toBeVisible();
  const resetStripe = page.getByRole("button", { name: "Dar nova chance no Stripe" });
  await waitForHydration(resetStripe);
  await resetStripe.click();
  const dialog = page.getByRole("dialog", { name: "Dar nova chance no Stripe" });
  await expect(dialog).toContainText("A conta recusada fica no histórico");
  await expect(dialog).toContainText("Isso não libera repasses nem tira uma suspensão");
  await dialog.getByRole("textbox", { name: "Motivo" }).fill("Dados de recebimento corrigidos.");
  await dialog.getByRole("button", { name: "Dar nova chance no Stripe" }).click();
  await expect(page.getByText("Nova chance liberada. O cadastro de recebimento pode começar de novo.")).toBeVisible();
  await expect(page.getByText("Não começou", { exact: true })).toBeVisible();
  await expect(page.getByText("Não", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dar nova chance no Stripe" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Abrir detalhes: Conta de recebimento recusada/ })).toBeVisible();
  await page.getByRole("link", { name: "Ver na trilha", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/admin/audit-entries\\?targetType=host&targetId=${"0199d2a0-0000-7000-8000-000000003302"}`),
  );
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir detalhes: Conta de recebimento recusada/ })).toBeVisible();
});

test("REQ-AACC-007/008 empresa suspensa libera identidade sem apagar evidência nem expor CNPJ na URL", async ({
  page,
}) => {
  await page.goto("/admin/users?type=hosts");
  await page.getByRole("link", { name: "Ana empresa", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ana empresa" })).toBeVisible();
  await expect(page.getByText("**.***.***/****-81")).toBeVisible();

  const suspend = page.getByRole("button", { name: "Suspender conta" });
  await waitForHydration(suspend);
  await suspend.click();
  const suspension = page.getByRole("dialog", { name: "Suspender conta" });
  await suspension.getByRole("textbox", { name: "Motivo" }).fill("Conflito de CNPJ conferido.");
  await suspension.getByRole("button", { name: "Suspender conta" }).click();
  await expect(page.getByText("Conta suspensa.")).toBeVisible();

  await page.getByRole("button", { name: "Liberar identidade" }).click();
  const release = page.getByRole("dialog", { name: "Liberar identidade" });
  await release.getByRole("textbox", { name: "Motivo" }).fill("Empresa titular confirmada.");
  await release.getByRole("textbox", { name: "Digite LIBERAR para confirmar" }).fill("LIBERAR");
  await release.getByRole("button", { name: "Liberar identidade" }).click();
  await expect(page.getByText("Identidade liberada. Essa conta não volta.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tirar suspensão" })).toHaveCount(0);
  await page.getByRole("button", { name: "Mostrar CNPJ" }).click();
  await expect(page.getByText("11.222.333/0001-81")).toBeVisible();
  await expect(page).not.toHaveURL(/11222333000181/);
});
