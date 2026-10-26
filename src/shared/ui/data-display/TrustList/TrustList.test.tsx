import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { TrustList } from "./TrustList";

it("REQ-UIC-002 garantias em caixas preservam título, apoio e ícones decorativos", () => {
  renderWithProviders(
    <TrustList
      variant="cards"
      items={[
        { title: "Conversa antes de fechar", description: "Pergunte tudo sobre a casa e a rotina.", icon: "chat" },
        { title: "Foto do seu pet todo dia", description: "As notícias chegam pelo chat.", icon: "camera" },
        {
          title: "Pagamento guardado",
          description: "O anfitrião só recebe depois que seu pet volta pra casa.",
          icon: "lock",
        },
      ]}
    />,
    { theme: quintalTheme },
  );
  const items = within(screen.getByRole("list", { name: "Garantias da PetHost" })).getAllByRole("listitem");
  expect(items).toHaveLength(3);
  for (const item of items) {
    expect(item).toHaveAttribute("data-surface");
    expect(within(item).getByRole("heading", { level: 2 })).toBeVisible();
    expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  }
  expect(screen.getByText("As notícias chegam pelo chat.")).toBeVisible();
});

it("REQ-UIC-002 o modo compacto dos formulários mantém as garantias existentes", () => {
  renderWithProviders(<TrustList items={["Converse antes", "Foto todo dia"]} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Converse antes")).toBeVisible();
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
});
