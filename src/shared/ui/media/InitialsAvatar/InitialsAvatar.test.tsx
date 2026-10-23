import { fireEvent, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { InitialsAvatar } from "./InitialsAvatar";

it("076 conserva a foto e mostra as iniciais se a imagem falhar", () => {
  renderWithProviders(<InitialsAvatar name="Camila Souza" src="/photo.png" alt="Foto de Camila" />, { theme: quintalTheme });
  const image = screen.getByRole("img", { name: "Foto de Camila" });
  expect(image).toHaveAttribute("src", "/photo.png");
  fireEvent.error(image);
  expect(screen.queryByRole("img", { name: "Foto de Camila" })).not.toBeInTheDocument();
  expect(screen.getByText("CS")).toBeVisible();
});
