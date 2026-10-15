import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { SignedDocumentViewer } from "./SignedDocumentViewer";
afterEach(() => vi.useRealTimers());
it("REQ-AQUEUE-006/007/016 pede foto sob clique, vence e fecha com Esc", async () => {
  const load = vi
    .fn()
    .mockResolvedValue({ url: "https://private.test/front", expiresAt: Math.floor(Date.now() / 1000) + 2 });
  vi.useFakeTimers();
  renderWithProviders(<SignedDocumentViewer label="Frente" load={load} />);
  expect(load).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Abrir foto: Frente" }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole("img", { name: "Frente" })).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(screen.getByRole("status").textContent).toContain("Esse link vence em");
  await act(() => vi.advanceTimersByTimeAsync(3_000));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Abrir de novo" })).toBeVisible();
  vi.useRealTimers();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("REQ-AQUEUE-006 exibe falha sem manter imagem e permite repetir", async () => {
  const { user } = renderWithProviders(
    <SignedDocumentViewer
      label="Verso"
      load={async () => {
        throw new Error("falha");
      }}
    />,
    { theme: quintalTheme },
  );
  await user.click(screen.getByRole("button", { name: "Abrir foto: Verso" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("REQ-AQUEUE-007/016 fecha sem cache, cancela pedido pendente e prende foco no diálogo", async () => {
  let signal: AbortSignal | undefined;
  let resolve: ((value: { url: string; expiresAt: number }) => void) | undefined;
  const load = vi.fn((currentSignal: AbortSignal) => {
    signal = currentSignal;
    return new Promise<{ url: string; expiresAt: number }>((done) => {
      resolve = done;
    });
  });
  const { user, queryClient } = renderWithProviders(<SignedDocumentViewer label="Frente" load={load} />);
  const opener = screen.getByRole("button", { name: "Abrir foto: Frente" });
  await user.click(opener);
  await user.tab();
  expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolve?.({ url: "https://private.test/late", expiresAt: 2_000_000_000 });
  });
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(opener).toHaveFocus();
});
it("REQ-AQUEUE-006 imagem com erro é descartada e nova abertura pede outro link", async () => {
  const load = vi.fn().mockResolvedValue({ url: "https://private.test/front", expiresAt: 2_000_000_000 });
  const { user } = renderWithProviders(<SignedDocumentViewer label="Frente" load={load} />);
  await user.click(screen.getByRole("button", { name: "Abrir foto: Frente" }));
  fireEvent.error(await screen.findByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Abrir de novo" }));
  expect(await screen.findByRole("img")).toBeVisible();
  expect(load).toHaveBeenCalledTimes(2);
});
