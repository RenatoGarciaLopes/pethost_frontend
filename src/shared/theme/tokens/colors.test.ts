import { expect, it } from "vitest";
import { quintalColors } from "./colors";

it("REQ-DS-001 preserva os onze tokens oficiais, sem azul de foco", () => {
  expect(quintalColors).toEqual({
    papel: "#FEFAF3",
    tinta: "#1F1A17",
    texto2: "#5A4E45",
    coral: "#F26B3A",
    gema: "#FFC93C",
    grama: "#C5DB4F",
    ceu: "#7FC4E0",
    luz: "#FFE9B0",
    cartao: "#FFF6E6",
    linha: "#E3D6C2",
    erro: "#A8323E",
  });
});
