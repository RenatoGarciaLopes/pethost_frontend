import { alpha, type Theme } from "@mui/material/styles";
import type { FeedbackTone } from "./feedbackIcons";

/**
 * Superfície de cada tom de feedback, lida do tema (nunca hex no componente).
 * Texto sempre em tinta; o tom aparece no fundo, na borda e no ícone.
 * - `atencao`: fundo luz com borda tracejada (vault: aviso é pílula tracejada, nunca vermelho).
 * - `erro`: fundo branco, borda e ícone na cor de erro (erro real, com cor própria).
 */
export function toneSurface(theme: Theme, tone: FeedbackTone) {
  const ink = theme.palette.quintal.tinta;
  switch (tone) {
    case "info":
      return { background: alpha(theme.palette.info.main, 0.22), border: `2px solid ${ink}`, icon: ink };
    case "ok":
      return { background: alpha(theme.palette.success.main, 0.35), border: `2px solid ${ink}`, icon: ink };
    case "atencao":
      return { background: theme.palette.quintal.luz, border: `2px dashed ${ink}`, icon: ink };
    case "erro":
      return {
        background: theme.palette.background.paper,
        border: `2px solid ${theme.palette.error.main}`,
        icon: theme.palette.error.main,
      };
  }
}
