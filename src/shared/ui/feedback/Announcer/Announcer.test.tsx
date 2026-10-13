import { renderHook, screen } from "@testing-library/react";
import { Button } from "@mui/material";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AnnouncerProvider, useAnnounce } from "./Announcer";

function AnnounceButton({ message }: { message: string }) {
  const announce = useAnnounce();
  return <Button onClick={() => announce(message)}>Anunciar</Button>;
}

describe("REQ-SWITCH-006 região viva do app", () => {
  it("anuncia a frase numa região polite, vazia antes do primeiro aviso", async () => {
    const { user } = renderWithProviders(
      <AnnouncerProvider>
        <AnnounceButton message="Agora você está na conta de anfitrião." />
      </AnnouncerProvider>,
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Anunciar" }));

    expect(region).toHaveTextContent("Agora você está na conta de anfitrião.");
  });

  it("a mesma frase repetida vira um nó novo, para o leitor de tela ler de novo", async () => {
    const { user } = renderWithProviders(
      <AnnouncerProvider>
        <AnnounceButton message="Pronto." />
      </AnnouncerProvider>,
    );
    const button = screen.getByRole("button", { name: "Anunciar" });
    await user.click(button);
    const first = screen.getByText("Pronto.");

    await user.click(button);

    expect(screen.getByText("Pronto.")).not.toBe(first);
  });

  it("fora do provider avisa o erro de montagem", () => {
    expect(() => renderHook(() => useAnnounce())).toThrow("useAnnounce precisa do AnnouncerProvider");
  });
});
