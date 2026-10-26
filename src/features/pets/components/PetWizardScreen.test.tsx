import { screen, within, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { PetWizardScreen } from "./PetWizardScreen";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Percorre dois passos digitando: folga para a máquina carregada (estourava os 5 s padrão).
it(
  "REQ-PNEW-013 carteirinha ao vivo acompanha respostas aceitas sem botões de editar",
  { timeout: 15000 },
  async () => {
    sessionStorage.clear();
    const { user } = renderWithProviders(
      <AnnouncerProvider>
        <PetWizardScreen accountId="live-test" initialSpecies="cat" />
      </AnnouncerProvider>,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("article", { name: "Carteirinha de seu pet" })).toHaveTextContent("Gato");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.type(screen.getByLabelText(/^Nome/), "Mel");
    await user.click(screen.getByRole("radio", { name: "Fêmea" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    const card = screen.getByRole("article", { name: "Carteirinha de Mel" });
    expect(card).toHaveTextContent("fêmea");
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  },
);
it("REQ-HPETS-003 bloqueia antes de montar o formulário e os providers do wizard", () => {
  renderWithProviders(<PetWizardScreen accountId="pending-host" role="host" keeperPending />);
  expect(screen.getByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
});
it("REQ-HPETS-004 abertura própria do anfitrião mantém os passos existentes", async () => {
  sessionStorage.clear();
  renderWithProviders(<PetWizardScreen accountId="host-start" role="host" />, { theme: quintalTheme });
  await waitFor(() => expect(screen.getByRole("heading", { name: "Quem mora com você?" })).toBeVisible());
  expect(screen.getByRole("radio", { name: "Cachorro" })).toBeInTheDocument();
});
