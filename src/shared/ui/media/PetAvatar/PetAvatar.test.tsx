import { act, fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PetAvatar } from "./PetAvatar";

it("preserva a foto e volta ao desenho da espécie se ela falhar", () => {
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
    const { container } = renderWithProviders(<PetAvatar petId="mel" name="Mel" species="cat" src="/mel.jpg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/mel.jpg");
    expect(screen.getByRole("img", { name: "Mel" })).toBeVisible();
    act(() => {
      fireEvent.error(probe);
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  } finally {
    vi.unstubAllGlobals();
  }
});

it("mantém a mesma cara pelo id, independente de nome e tamanho", () => {
  const { container, rerender } = renderWithProviders(<PetAvatar petId="pet-1" name="Mel" species="dog" />);
  const drawing = container.querySelector("svg")!.innerHTML;
  rerender(<PetAvatar petId="pet-1" name="Novo nome" species="dog" size={72} />);
  expect(container.querySelector("svg")!.innerHTML).toBe(drawing);
  expect(screen.getByRole("img", { name: "Novo nome" })).toBeVisible();
});

it("distingue espécies e oferece quatro pelagens por cachorro e gato", () => {
  const { container, rerender } = renderWithProviders(<PetAvatar petId="0" name="Pet" />);
  for (const species of ["dog", "cat"]) {
    const drawings = new Set<string>();
    for (const petId of ["0", "1", "2", "3"]) {
      rerender(<PetAvatar petId={petId} name="Pet" species={species} />);
      drawings.add(container.querySelector("svg")!.innerHTML);
    }
    expect(drawings.size).toBe(4);
  }
  const drawings = new Set<string>();
  for (const species of ["dog", "cat", "rabbit", "hamster", "canary", "fish", "turtle", "exotic"]) {
    rerender(<PetAvatar petId="0" name="Pet" species={species} />);
    drawings.add(container.querySelector("svg")!.innerHTML);
  }
  expect(drawings.size).toBe(8);
});

it.each([
  ["parrot", "canary"],
  ["parakeet", "canary"],
  ["cockatiel", "canary"],
  ["guinea_pig", "hamster"],
  [null, "exotic"],
  ["unknown", "exotic"],
])("mapeia %s para o grupo %s", (species, group) => {
  const { container, rerender } = renderWithProviders(<PetAvatar petId="0" name="Pet" species={species} />);
  const drawing = container.querySelector("svg")!.innerHTML;
  rerender(<PetAvatar petId="0" name="Pet" species={group} />);
  expect(container.querySelector("svg")!.innerHTML).toBe(drawing);
});
