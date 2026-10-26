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

it.each([
  "http://localhost:9000/pethost-images/avatar.jpg",
  "http://127.0.0.1:9000/avatar.jpg",
  "//localhost:9000/avatar.jpg",
  "http://10.0.0.59/avatar.jpg",
  "http://192.168.1.2/avatar.jpg",
  "http://172.16.0.2/avatar.jpg",
  "http://[::1]/avatar.jpg",
  "http://rustfs:9000/avatar.jpg",
])("em produção usa iniciais sem tentar carregar o avatar local %s", (src) => {
  vi.stubEnv("NODE_ENV", "production");
  const image = vi.fn();
  vi.stubGlobal("Image", image);
  try {
    renderWithProviders(<InitialsAvatar name="Ana Souza" src={src} alt="Foto" />, { theme: quintalTheme });
    expect(screen.queryByRole("img", { name: "Foto" })).not.toBeInTheDocument();
    expect(screen.getByText("AS")).toBeVisible();
    expect(image).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});

it.each(["https://media.pethost.cfd/avatars/photo.jpg", "/photo.jpg"])(
  "preserva avatar público ou relativo em produção: %s",
  (src) => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      renderWithProviders(<InitialsAvatar name="Ana Souza" src={src} alt="Foto" />, { theme: quintalTheme });
      expect(screen.getByRole("img", { name: "Foto" })).toHaveAttribute("src", src);
    } finally {
      vi.unstubAllEnvs();
    }
  },
);
