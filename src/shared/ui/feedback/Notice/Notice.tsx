"use client";
import { Box, Typography } from "@mui/material";
import type { ReactNode, Ref } from "react";
import { toneIcon, type FeedbackTone } from "../feedbackIcons";
import { toneSurface } from "../toneStyles";

export interface NoticeProps {
  /** Gravidade. `erro` vira `role="alert"` (anunciado na hora); os demais, `role="status"`. */
  tone: FeedbackTone;
  /** Frase principal, curta. */
  title?: ReactNode;
  /** Detalhe ou orientação do que fazer. */
  children?: ReactNode;
  /** Ação ao lado do texto (ex.: botão "Reativar", link de suporte). */
  action?: ReactNode;
  /**
   * Ref do contêiner. Ele aceita foco programático (`tabIndex={-1}`): o login leva o foco
   * para o aviso de erro depois de um envio que falhou.
   */
  ref?: Ref<HTMLDivElement>;
  id?: string;
}

/**
 * Aviso em bloco com ícone desenhado e cor do tom (REQ-DS-013). Nunca só a cor: sempre ícone e texto.
 * Primitivo sem domínio: o texto chega pronto (ex.: `getErrorMessage(error)`).
 *
 * @example
 * <Notice tone="erro" ref={noticeRef} title={getErrorMessage(error)} />
 * <Notice tone="atencao" title="Essa conta está pausada." action={<Button>Reativar</Button>} />
 */
export function Notice({ tone, title, children, action, ref, id }: NoticeProps) {
  const Icon = toneIcon[tone];
  return (
    <Box
      ref={ref}
      id={id}
      role={tone === "erro" ? "alert" : "status"}
      tabIndex={-1}
      data-tone={tone}
      sx={(theme) => {
        const surface = toneSurface(theme, tone);
        return {
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          padding: "14px 16px",
          borderRadius: "18px",
          backgroundColor: surface.background,
          border: surface.border,
          color: "text.primary",
          "& > svg": { color: surface.icon, flexShrink: 0, marginTop: "1px" },
          "&:focus-visible": { outlineOffset: 3 },
        };
      }}
    >
      <Icon />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <Typography component="p" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
            {title}
          </Typography>
        ) : null}
        {children ? <Box sx={{ mt: title ? 0.5 : 0, color: "text.secondary", "& p": { m: 0 } }}>{children}</Box> : null}
        {action ? <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>{action}</Box> : null}
      </Box>
    </Box>
  );
}
