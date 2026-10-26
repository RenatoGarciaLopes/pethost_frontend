"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useId, useRef, type ReactNode } from "react";
import { Notice } from "../Notice";

export interface ConfirmDialogProps {
  open: boolean;
  /** Pergunta curta; nomeia o diálogo (`aria-labelledby`). */
  title: string;
  /** Texto do corpo (DialogContentText); descreve o diálogo (`aria-describedby`). */
  message: ReactNode;
  /** Verbo do que vai acontecer (ex.: "Tirar da lista"), nunca "OK" ou "Sim". */
  confirmLabel: string;
  /** Ação segura: recebe o foco ao abrir (REQ-PEDIT-011). */
  cancelLabel: string;
  onConfirm: () => void;
  /** Botão seguro, Esc e clique fora. */
  onCancel: () => void;
  /** Confirmação em andamento: botão de confirmar ocupado, nada fecha. */
  busy?: boolean;
  /** Erro da confirmação, já em português (ex.: 409), mostrado dentro do diálogo. */
  error?: string | null;
  /** Campos da confirmação (ex.: motivo opcional), abaixo do texto; não entram na descrição do diálogo. */
  children?: ReactNode;
  /**
   * Terceira saída, entre confirmar e a ação segura (ex.: "Salvar e ir" / "Descartar" / "Ficar" ao trocar de seção
   * com alteração não salva, 107). Também um verbo do que vai acontecer.
   */
  alternative?: { label: string; onClick: () => void };
}

/**
 * Pergunta de confirmação neutra (spec 022, REQ-PEDIT-011): sem cor de alerta, ícone de perigo ou emoji; os dois
 * botões (três, com `alternative`) no tom padrão do tema. O foco começa na ação segura; Esc e clique fora cancelam (exceto `busy`); ao
 * fechar, o MUI devolve o foco a quem abriu. Controlado e sem HTTP: quem usa abre, fecha e faz a chamada.
 *
 * Quando usar: ação que tira algo de vista ou descarta trabalho (tirar o pet da lista, "Sair sem salvar?",
 * pausar a conta, desistir da verificação). Quando não usar: aviso sem decisão (use `Notice`) ou formulário
 * dentro do diálogo.
 *
 * @example
 * <ConfirmDialog
 *   open={asking}
 *   title="Tirar Thor da lista?"
 *   message="A ficha de Thor sai da sua lista. As estadias antigas continuam no histórico."
 *   confirmLabel="Tirar da lista"
 *   cancelLabel="Deixar como está"
 *   busy={deactivate.isPending}
 *   error={deactivate.error ? translateError(deactivate.error) : null}
 *   onConfirm={() => deactivate.mutate()}
 *   onCancel={() => setAsking(false)}
 * />
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  error = null,
  children,
  alternative,
}: ConfirmDialogProps) {
  const id = useId();
  const titleId = `${id}-titulo`;
  const messageId = `${id}-corpo`;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={open}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onClose={() => {
        if (!busy) onCancel();
      }}
      // No navegador o FocusTrap do MUI pode tomar o foco depois do `autoFocus`; ao terminar de abrir, a ação
      // segura recebe o foco de novo (REQ-PEDIT-011). Se a pessoa já foi a um campo do corpo, o foco fica lá:
      // roubá-lo no meio da digitação perderia letras.
      slotProps={{
        transition: {
          onEntered: () => {
            if (!contentRef.current?.contains(document.activeElement)) cancelRef.current?.focus();
          },
        },
      }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent ref={contentRef}>
        <DialogContentText id={messageId} sx={{ color: "text.primary" }}>
          {message}
        </DialogContentText>
        {children}
        {error && (
          <Notice tone="erro" id={`${id}-erro`}>
            {error}
          </Notice>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 3 }}>
        <Button type="button" onClick={onConfirm} disabled={busy} aria-busy={busy || undefined}>
          {confirmLabel}
        </Button>
        {alternative && (
          <Button type="button" onClick={alternative.onClick} disabled={busy}>
            {alternative.label}
          </Button>
        )}
        <Button ref={cancelRef} type="button" autoFocus onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
