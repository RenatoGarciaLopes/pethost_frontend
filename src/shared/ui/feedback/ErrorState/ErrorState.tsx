"use client";
import { Box, Button, Typography } from "@mui/material";
import type { ElementType, ReactNode } from "react";
import { ErrorIcon } from "../feedbackIcons";

export interface ErrorStateProps {
  /** Frase principal. Padrão: a frase genérica da PetHost. Nunca a mensagem técnica. */
  title?: ReactNode;
  /** Orientação do que fazer. */
  description?: ReactNode;
  /** Mostra "Tentar de novo" e chama esta função (ex.: `reset` do `error.tsx` ou `refetch`). */
  onRetry?: () => void;
  /** Texto do botão de repetir (padrão "Tentar de novo"). */
  retryLabel?: string;
  /** Código do erro 500 para o suporte (`ApiError.traceId`). Aparece selecionável. */
  traceId?: string;
  /** Ação extra (ex.: link "Voltar para o início"). */
  secondaryAction?: ReactNode;
  /** Nível do título na página (padrão `h2`). */
  headingComponent?: ElementType;
}

/**
 * Estado de erro de uma tela ou seção (REQ-DS-014): voz da marca, o que fazer e, quando houver,
 * o código para o suporte. Anunciado na hora (`role="alert"`). Nunca mostra pilha nem mensagem técnica.
 *
 * @example <ErrorState onRetry={reset} traceId={isApiError(error) ? error.traceId : undefined} />
 */
export function ErrorState({
  title = "Deu um problema do nosso lado.",
  description = "Tenta de novo; se continuar, fala com a gente.",
  onRetry,
  retryLabel = "Tentar de novo",
  traceId,
  secondaryAction,
  headingComponent = "h2",
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
        py: 4,
        px: 2,
        maxWidth: 480,
        mx: "auto",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `2px solid ${theme.palette.quintal.tinta}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `3px 3px 0 ${theme.palette.quintal.tinta}`,
          color: theme.palette.error.main,
          "& svg": { width: 32, height: 32 },
        })}
      >
        <ErrorIcon />
      </Box>
      <Typography component={headingComponent} variant="h3">
        {title}
      </Typography>
      <Typography component="p" sx={{ color: "text.secondary", m: 0 }}>
        {description}
      </Typography>
      {traceId ? (
        <Typography component="p" sx={{ fontSize: "0.88rem", color: "text.secondary", m: 0 }}>
          Código para o suporte:{" "}
          <Box component="code" sx={{ userSelect: "all", fontFamily: "monospace", color: "text.primary" }}>
            {traceId}
          </Box>
        </Typography>
      ) : null}
      {onRetry || secondaryAction ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 1 }}>
          {onRetry ? (
            <Button variant="contained" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction}
        </Box>
      ) : null}
    </Box>
  );
}
