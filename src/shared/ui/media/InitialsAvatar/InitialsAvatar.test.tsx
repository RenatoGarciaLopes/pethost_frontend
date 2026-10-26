import { act, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { InitialsAvatar } from "./InitialsAvatar";

it("076 conserva a foto e mostra as iniciais se a imagem falhar", () => {
  const probe = document.createElement("img");
  vi.stubGlobal(
    "Image",
    class {
      constructor() {
        return probe;
      }
    },
  );
  try {
    renderWithProviders(<InitialsAvatar name="Camila Souza" src="/photo.png" alt="Foto de Camila" />, {
      theme: quintalTheme,
    });
    expect(screen.getByRole("img", { name: "Foto de Camila" })).toHaveAttribute("src", "/photo.png");
    act(() => {
      probe.dispatchEvent(new Event("error"));
    });
    expect(screen.queryByRole("img", { name: "Foto de Camila" })).not.toBeInTheDocument();
    expect(screen.getByText("CS")).toBeVisible();
  } finally {
    vi.unstubAllGlobals();
  }
});
