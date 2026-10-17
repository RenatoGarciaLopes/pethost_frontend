"use client";
import { useState } from "react";
import { Button, Typography } from "@mui/material";
import { writeClipboard } from "@/shared/lib/clipboard/writeClipboard";

/** Botão para copiar texto público de interface e anunciar o resultado.
 * @example <CopyButton value={traceId} label="Identificador da requisição" />
 */
export interface CopyButtonProps {
  /** Texto que será copiado após ação explícita. */
  value: string;
  /** Nome acessível do botão e conteúdo do aviso. */
  label: string;
}

/** Copia somente após clique; nunca persiste nem registra o valor.
 * @example <CopyButton value={traceId} label="Identificador da requisição" />
 */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [result, setResult] = useState<"copied" | "failed" | null>(null);

  async function copyValue() {
    try {
      await writeClipboard(value);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  }

  return (
    <span>
      <Button onClick={() => void copyValue()} aria-label={`Copiar ${label}`} sx={{ minHeight: 44 }}>
        Copiar
      </Button>
      {result && (
        <Typography role="status" component="span" sx={{ ml: 1 }}>
          {result === "copied" ? `${label} copiado.` : `Não foi possível copiar ${label.toLocaleLowerCase("pt-BR")}.`}
        </Typography>
      )}
    </span>
  );
}
