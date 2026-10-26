import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CopyButton } from "./CopyButton";

const clipboard = vi.hoisted(() => ({ writeClipboard: vi.fn() }));
vi.mock("@/shared/lib/clipboard/writeClipboard", () => ({ writeClipboard: clipboard.writeClipboard }));

describe("CopyButton", () => {
  afterEach(() => {
    clipboard.writeClipboard.mockReset();
  });

  it("REQ-AUDIT-006 copia por ação e anuncia o sucesso", async () => {
    clipboard.writeClipboard.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<CopyButton value="trace-sintetico" label="Trace ID" />);

    await user.click(screen.getByRole("button", { name: "Copiar Trace ID" }));

    expect(clipboard.writeClipboard).toHaveBeenCalledWith("trace-sintetico");
    expect(screen.getByRole("status")).toHaveTextContent("Trace ID copiado.");
  });

  it("anuncia quando o navegador não permite copiar", async () => {
    clipboard.writeClipboard.mockRejectedValue(new Error());
    const { user } = renderWithProviders(<CopyButton value="trace-sintetico" label="Trace ID" />);

    await user.click(screen.getByRole("button", { name: "Copiar Trace ID" }));

    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível copiar trace id.");
  });
});
