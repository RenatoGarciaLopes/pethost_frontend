import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useState } from "react";
import { renderWithProviders } from "@/test/render";
import { ReasonActionDialog } from "./ReasonActionDialog";
it("REQ-AACC-005/007/013 liberar exige motivo e LIBERAR, prende foco e devolve à origem", async () => {
  const confirm = vi.fn();
  function Frame() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Abrir ação</button>
        {open && (
          <ReasonActionDialog
            open
            title="Liberar CPF"
            effect="Essa conta não volta."
            confirmLabel="Liberar"
            cancelLabel="Cancelar"
            reasonLabel="Motivo"
            reasonHelp="Até 500 caracteres"
            confirmationWord="LIBERAR"
            confirmationLabel="Digite LIBERAR"
            onConfirm={confirm}
            onCancel={() => setOpen(false)}
          />
        )}
      </>
    );
  }
  const { user } = renderWithProviders(<Frame />);
  const opener = screen.getByRole("button", { name: "Abrir ação" });
  await user.click(opener);
  const save = screen.getByRole("button", { name: "Liberar" });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo" }), { target: { value: "Conferido" } });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Digite LIBERAR" }), { target: { value: "LIBERAR" } });
  await user.click(save);
  expect(confirm).toHaveBeenCalledWith({ reason: "Conferido" });
  await user.tab();
  expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(opener).toHaveFocus();
});
it("REQ-AACC-006 confirmação sem motivo não inventa campo para DELETE", async () => {
  const confirm = vi.fn();
  const { user } = renderWithProviders(
    <ReasonActionDialog
      open
      title="Tirar suspensão"
      effect="Recebe um e-mail"
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
      mode="confirmation"
      onConfirm={confirm}
      onCancel={() => {}}
    />,
  );
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Confirmar" }));
  expect(confirm).toHaveBeenCalledWith({});
});
