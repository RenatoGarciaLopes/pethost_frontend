import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders, createTestQueryClient } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { adminHostFixture } from "@/test/fixtures/adminAccounts";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { adminApplicationQueries, adminReviewCopy as copy } from "@/features/admin-host-applications";
import { HostApplicationReview } from "./HostApplicationReview";

// Decisão inteira (checklist, motivo e próxima solicitação): com a suíte em paralelo, 5 s não bastam.
vi.setConfig({ testTimeout: 20_000 });
afterEach(() => vi.unstubAllGlobals());
function setup(overrides: Record<string, unknown> = {}, wide = true) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: wide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  const app = adminApplicationFixture(overrides);
  const client = createTestQueryClient();
  client.setQueryData(adminApplicationQueries.detail("admin", app.id).queryKey, app);
  return {
    app,
    ...renderWithProviders(<HostApplicationReview accountId="admin" applicationId={app.id} />, {
      queryClient: client,
      theme: quintalTheme,
    }),
  };
}
it("REQ-AQUEUE-014/015 decidida mostra resumo e fotos apagadas sem painel", () => {
  setup({
    status: "approved",
    reviewNotes: "Conferido",
    reviewedBy: "0199d2a0-0000-7000-8000-000000000099",
    reviewedAt: "2026-10-02T12:00:00Z",
    documentsPurgedAt: "2026-10-03T12:00:00Z",
  });
  expect(screen.getByText(/Fotos apagadas em/)).toBeVisible();
  expect(screen.getByText(/Conferido/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Abrir foto/ })).not.toBeInTheDocument();
});
it("REQ-AQUEUE-008/009 celular mantém detalhe legível e orienta decisão pelo computador", () => {
  setup({}, false);
  expect(screen.getByText(copy.mobile)).toBeVisible();
  expect(screen.getByText(copy.sent)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
});
it("REQ-AQUEUE-012 sucesso oferece a próxima solicitação ainda em análise", async () => {
  const { app, user } = setup();
  const following = adminApplicationFixture({ id: "0199d2a0-0000-7000-8000-000000000088" });
  server.use(
    http.post("*/api/host-applications/:id/approval", () => HttpResponse.json(apiOk({ ...app, status: "approved" }))),
    http.get("*/api/host-applications/:id", () => HttpResponse.json(apiOk({ ...app, status: "approved" }))),
    http.get("*/api/host-applications", () => HttpResponse.json(apiOk([following]))),
  );
  await user.type(screen.getByRole("textbox", { name: copy.reason }), "Tudo conferido");
  for (const name of copy.checklist) await user.click(screen.getByRole("checkbox", { name }));
  await user.click(screen.getByRole("button", { name: "Aprovar" }));
  expect(await screen.findByText(copy.success)).toBeVisible();
  expect(await screen.findByRole("link", { name: copy.next })).toHaveAttribute(
    "href",
    `/admin/host-applications/${following.id}`,
  );
});
it("REQ-AQUEUE-013 conflito atualiza resumo e remove o painel", async () => {
  const { app, user } = setup();
  server.use(
    http.post("*/api/host-applications/:id/rejection", () =>
      HttpResponse.json(apiFail("HOST_APPLICATION_CONFLICT"), { status: 409 }),
    ),
    http.get("*/api/host-applications/:id", () =>
      HttpResponse.json(apiOk({ ...app, status: "rejected", rejectionReason: "other", reviewNotes: "Outra decisão" })),
    ),
  );
  await user.type(screen.getByRole("textbox", { name: copy.reason }), "Nota");
  await user.click(screen.getByRole("button", { name: copy.rejection.other }));
  await user.click(screen.getByRole("button", { name: "Recusar" }));
  expect(await screen.findByText(copy.conflict)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
});
it("REQ-AQUEUE-010 erro de validação mantém nota e associa mensagem ao campo", async () => {
  const { user } = setup();
  server.use(
    http.post("*/api/host-applications/:id/rejection", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "Invalid", [
          {
            field: "reason",
            messages: ["Descreva o que foi conferido."],
            errors: [{ code: "HOST_REASON_TOO_LONG", params: { max: 500 } }],
          },
        ]),
        { status: 400 },
      ),
    ),
  );
  const reason = screen.getByRole("textbox", { name: copy.reason });
  await user.click(reason);
  await user.paste("Nota de teste");
  await user.click(screen.getByRole("button", { name: copy.rejection.other }));
  await user.click(screen.getByRole("button", { name: "Recusar" }));
  expect(await screen.findByText(/O motivo aceita até 500 caracteres/)).toBeVisible();
  expect(reason).toHaveAttribute("aria-invalid", "true");
  expect(reason).toHaveValue("Nota de teste");
  expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled();
});
it("REQ-AACC-012 conflito de CPF/CNPJ oferece atalho para anfitrião listado sem expor documento", async () => {
  const { app, user } = setup({ personType: "pf" });
  const host = adminHostFixture({ cpf: app.cpf });
  server.use(
    http.post("*/api/host-applications/:id/rejection", () =>
      HttpResponse.json(apiFail("HOST_CPF_ALREADY_REGISTERED"), { status: 409 }),
    ),
    http.get("*/api/hosts", () => HttpResponse.json(apiOk([host]))),
  );
  await user.type(screen.getByRole("textbox", { name: copy.reason }), "Documento conferido");
  await user.click(screen.getByRole("button", { name: copy.rejection.data_mismatch }));
  await user.click(screen.getByRole("button", { name: copy.reject }));
  const link = await screen.findByRole("link", { name: `Ver conta de ${host.user?.fullName}` });
  expect(link).toHaveAttribute("href", `/admin/users/hosts/${host.id}`);
  expect(link.getAttribute("href")).not.toContain(app.cpf);
});
it("REQ-AQUEUE-005/006 REQ-UIC-009 nome no título, fotos como cartões com desenho e aviso da trilha, decisão na caixa ao lado", () => {
  setup();
  expect(screen.getByRole("heading", { level: 1, name: "Conferir verificação: Pessoa de teste" })).toBeVisible();
  expect(screen.getByText(copy.requestLine("02/10", 1, copy.person.pf))).toBeVisible();
  expect(screen.getByText(copy.status.submitted)).toHaveAttribute("data-tone", "info");
  for (const kind of ["front", "back", "selfie"] as const) {
    const open = screen.getByRole("button", { name: `${copy.open}: ${copy.photo[kind]}` });
    expect(open.querySelector("svg")).not.toBeNull();
  }
  expect(screen.getByText(copy.photosAudit)).toBeVisible();
  const decision = screen.getByRole("complementary", { name: copy.decision });
  expect(within(decision).getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
});
