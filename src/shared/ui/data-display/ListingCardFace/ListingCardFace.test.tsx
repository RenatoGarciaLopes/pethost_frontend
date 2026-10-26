import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { ListingCardFace } from "./ListingCardFace";

const render = (ui: React.ReactElement) => renderWithProviders(ui, { theme: quintalTheme });

it("REQ-SRCH-007 monta capa, chip do anfitrião, título, lugar, atributos, extras e preço na ordem do card", () => {
  render(
    <ListingCardFace
      cover={<span>capa</span>}
      badge={<span>Vizinho</span>}
      host={{ name: "Cida Souza" }}
      title="Casa da Cida"
      location="Zona 7 · Maringá"
      attributes={[
        { icon: "apartment", label: "Apartamento" },
        { icon: "yard", label: "Quintal" },
      ]}
      price="R$ 60,00/noite"
    >
      <p>Recebe cachorro</p>
    </ListingCardFace>,
  );
  expect(screen.getByRole("heading", { level: 2, name: "Casa da Cida" })).toBeVisible();
  expect(screen.getByText("CS")).toBeVisible();
  const order = [
    "capa",
    "Vizinho",
    "Cida Souza",
    "Casa da Cida",
    "Zona 7 · Maringá",
    "Apartamento",
    "Quintal",
    "Recebe cachorro",
    "R$ 60,00/noite",
  ];
  const text = document.body.textContent ?? "";
  const positions = order.map((part) => text.indexOf(part));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

it("REQ-SRCH-007 o título aceita outro elemento e sem atributos não há linha de ícones", () => {
  render(
    <ListingCardFace
      cover={null}
      host={{ name: "Cida" }}
      title="Prévia"
      titleComponent="p"
      location="Seu bairro"
      price="R$ —"
    />,
  );
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  expect(document.querySelector("svg")).toBeNull();
});
