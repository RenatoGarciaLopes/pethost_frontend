import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { PetWizardScreen } from "./PetWizardScreen";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
it("REQ-PNEW-013 carteirinha ao vivo acompanha respostas aceitas sem botões de editar", async () => {
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
});
