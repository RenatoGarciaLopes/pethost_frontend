import { expect, it, vi } from "vitest";
import { writeClipboard } from "./writeClipboard";

it("encaminha somente o valor solicitado para a Clipboard API", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  await writeClipboard("trace-sintetico", { writeText });
  expect(writeText).toHaveBeenCalledWith("trace-sintetico");
});

it("preserva a falha da Clipboard API para a interface anunciar", async () => {
  const writeText = vi.fn().mockRejectedValue(new Error("denied"));
  await expect(writeClipboard("trace-sintetico", { writeText })).rejects.toThrow("denied");
});
