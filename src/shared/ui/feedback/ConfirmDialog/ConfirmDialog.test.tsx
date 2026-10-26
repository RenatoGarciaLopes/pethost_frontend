import { screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";

const texts = {
  title: "Tirar Thor da lista?",
  message: "A ficha de Thor sai da sua lista. As estadias antigas continuam no histórico.",
  confirmLabel: "Tirar da lista",
  cancelLabel: "Deixar como está",
};

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <ConfirmDialog open {...texts} onConfirm={onConfirm} onCancel={onCancel} {...props} />,
    { theme: quintalTheme },
  );
  return { ...view, onConfirm, onCancel };
}

/** Abre pelo botão e fecha no cancelar, como uma tela de verdade. */
function Opener() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Tirar da lista
      </button>
      <ConfirmDialog open={open} {...texts} onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
    </>
  );
}

describe("ConfirmDialog", () => {
  it("107 ação alternativa delega descarte e respeita ocupado", async () => {
    const discard = vi.fn();
    const { user, rerender } = renderDialog({ alternative: { label: "Descartar", onClick: discard } });
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(discard).toHaveBeenCalledOnce();
    rerender(
      <ConfirmDialog
        open
        {...texts}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        busy
        alternative={{ label: "Descartar", onClick: discard }}
      />,
    );
    expect(screen.getByRole("button", { name: "Descartar" })).toBeDisabled();
  });
  it("REQ-PEDIT-011 diálogo nomeado pelo título e descrito pelo corpo, com as duas ações", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: texts.title });
    expect(dialog).toHaveAccessibleDescription(texts.message);
    expect(screen.getByRole("button", { name: texts.confirmLabel })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: texts.cancelLabel })).toBeInTheDocument();
  });

  it("REQ-PEDIT-011 foco inicial na ação segura", async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByRole("button", { name: texts.cancelLabel })).toHaveFocus());
  });

  it("REQ-PEDIT-011 confirmar e cancelar chamam cada um o seu", async () => {
    const { user, onConfirm, onCancel } = renderDialog();
    await user.click(screen.getByRole("button", { name: texts.confirmLabel }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: texts.cancelLabel }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("REQ-PEDIT-011 Esc e clique fora cancelam", async () => {
    const { user, onCancel } = renderDialog();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    const backdrop = document.querySelector(".MuiBackdrop-root") as HTMLElement;
    await user.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("REQ-PEDIT-011 ocupado: confirmar fica ocupado e nada fecha", async () => {
    const { user, onConfirm, onCancel } = renderDialog({ busy: true });
    const confirm = screen.getByRole("button", { name: texts.confirmLabel });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: texts.cancelLabel })).toBeDisabled();
    await user.keyboard("{Escape}");
    await user.click(document.querySelector(".MuiBackdrop-root") as HTMLElement);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("REQ-PEDIT-013 erro da confirmação aparece dentro do diálogo", () => {
    renderDialog({ error: "Esse microchip já está em outra ficha." });
    const dialog = screen.getByRole("dialog", { name: texts.title });
    expect(dialog).toContainElement(screen.getByRole("alert"));
    expect(screen.getByRole("alert")).toHaveTextContent("Esse microchip já está em outra ficha.");
  });

  it("REQ-PEDIT-011 sem erro não há alerta", () => {
    renderDialog({ error: null });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("REQ-PEDIT-011 ao fechar, o foco volta para quem abriu", async () => {
    const { user } = renderWithProviders(<Opener />, { theme: quintalTheme });
    const opener = screen.getByRole("button", { name: texts.confirmLabel });
    await user.click(opener);
    await user.click(await screen.findByRole("button", { name: texts.cancelLabel }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});

describe("ConfirmDialog com campos", () => {
  it("REQ-HREQ-005 o conteúdo extra (ex.: motivo opcional) fica dentro do diálogo, abaixo do texto", () => {
    renderDialog({
      children: (
        <label>
          Motivo (opcional)
          <input />
        </label>
      ),
    });
    const dialog = screen.getByRole("dialog", { name: texts.title });
    expect(within(dialog).getByRole("textbox", { name: "Motivo (opcional)" })).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(texts.message);
  });

  it("REQ-STAYS-006 quem já foi ao campo antes do diálogo terminar de abrir continua digitando nele", async () => {
    function WithReason() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Cancelar estadia
          </button>
          <ConfirmDialog open={open} {...texts} onConfirm={vi.fn()} onCancel={() => setOpen(false)}>
            <label>
              Motivo (opcional)
              <input />
            </label>
          </ConfirmDialog>
        </>
      );
    }
    const { user } = renderWithProviders(<WithReason />, { theme: quintalTheme });
    await user.click(screen.getByRole("button", { name: "Cancelar estadia" }));
    const field = await screen.findByRole("textbox", { name: "Motivo (opcional)" });
    await user.type(field, "Mudança de planos");
    // Passa do fim da transição de entrada, quando o diálogo devolveria o foco à ação segura.
    await new Promise((resolve) => setTimeout(resolve, 400));
    await user.type(field, "!");
    expect(field).toHaveFocus();
    expect(field).toHaveValue("Mudança de planos!");
  });
});
