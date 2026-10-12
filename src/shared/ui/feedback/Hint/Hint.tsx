"use client";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { HintIcon } from "../feedbackIcons";

export interface HintProps {
  /** Texto da dica. Curto; orienta antes do erro acontecer. */
  children: ReactNode;
  /** Título opcional em destaque. */
  title?: ReactNode;
  /** Mostra a lâmpada (padrão `true`). */
  icon?: boolean;
  id?: string;
}

/**
 * Dica tracejada (REQ-DS-014): orientação calma junto do campo ou da seção, sem cara de alerta.
 * Para ligar a um campo, passe o `id` no `aria-describedby` dele.
 *
 * @example <Hint id="cep-dica">Pra mostrar cantinhos perto de você e pro pagamento.</Hint>
 */
export function Hint({ children, title, icon = true, id }: HintProps) {
  return (
    <Box
      id={id}
      sx={{
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: "18px",
        border: "2px dashed",
        borderColor: "divider",
        backgroundColor: "background.default",
        color: "text.secondary",
        fontSize: "0.94rem",
        lineHeight: 1.45,
        "& > svg": { color: "text.primary", flexShrink: 0, width: 20, height: 20 },
      }}
    >
      {icon ? <HintIcon /> : null}
      <Box>
        {title ? (
          <Box component="strong" sx={{ display: "block", color: "text.primary" }}>
            {title}
          </Box>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}
