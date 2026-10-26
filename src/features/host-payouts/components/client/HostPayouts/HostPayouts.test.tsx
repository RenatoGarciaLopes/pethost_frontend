import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { stripeAccountSchema } from "../../../api/contracts";
import { toPayoutAccount } from "../../../api/mappers";
import { payoutQueries } from "../../../api/queries";
import { HostPayouts } from "./HostPayouts";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
function setup(status?: string, disabledReason?: string) {
  const client = createTestQueryClient();
  client.setQueryData(
    payoutQueries.account("host").queryKey,
    status
      ? toPayoutAccount(
          stripeAccountSchema.parse(payoutAccountDto({ status, payoutsEnabled: status === "enabled", disabledReason })),
        )
      : null,
  );
  return renderWithProviders(<HostPayouts accountId="host" />, { queryClient: client, theme: quintalTheme });
}
it("REQ-PAYOUT-002 sem perfil mostra orientação e link de verificação sem erro", () => {
  setup();
  expect(
    screen.getByText("Primeiro a gente confere quem você é. Depois é aqui que você diz como quer receber."),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "Ver minha verificação" })).toHaveAttribute("href", "/host/application");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("REQ-PAYOUT-003 explica os 90% antes de oferecer cadastro", () => {
  setup("not_started");
  expect(
    screen.getByText("O tutor paga antes. A PetHost guarda o dinheiro e te passa 90% quando o pet volta pra casa."),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Cadastrar como eu recebo" })).toBeVisible();
  expect(screen.queryByRole("region", { name: "Cadastro de recebimento" })).not.toBeInTheDocument();
});
it.each([
  ["in_progress", "Seu cadastro de recebimento ficou pela metade.", "Continuar"],
  ["under_review", "O Stripe está conferindo seus dados. Leva até 2 dias úteis.", "Atualizar"],
  ["restricted", "O Stripe precisa de mais uma coisa: confirmar alguns dados.", "Resolver agora"],
])("REQ-PAYOUT-008 estado %s tem sua mensagem e ação", (status, message, action) => {
  setup(status, "requirements.past_due");
  expect(screen.getByText(message)).toBeVisible();
  expect(screen.getByRole("button", { name: action })).toBeVisible();
  expect(screen.queryByText("requirements.past_due")).not.toBeInTheDocument();
});
it("REQ-PAYOUT-008 recusa é neutra, sem cadastrar nem continuar", () => {
  setup("rejected");
  expect(screen.getByText(/O Stripe não aprovou o recebimento/)).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("REQ-PAYOUT-009 conta habilitada oferece o próximo passo", () => {
  setup("enabled");
  expect(screen.getByText("Recebimento conectado ✓")).toBeVisible();
  expect(screen.getByRole("link", { name: "Montar meu cantinho" })).toHaveAttribute("href", "/host/listings/new");
});
