import type { Components, Theme } from "@mui/material/styles";
import NextLink from "next/link";
import { focusRing, keyboardFocus } from "../focus";

/**
 * Quintal ButtonBase styling; compose through quintalTheme instead of per-feature overrides. Botão com `href` vira
 * link do Next pelo tema: componente de servidor passa só `href` (função não atravessa para componente de cliente).
 */
export const quintalButtonBase = {
  defaultProps: { LinkComponent: NextLink },
  styleOverrides: { root: { [keyboardFocus()]: focusRing } },
} satisfies Components<Theme>["MuiButtonBase"];
