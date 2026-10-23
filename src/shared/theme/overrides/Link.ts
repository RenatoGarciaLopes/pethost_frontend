import { quintalRadii } from "@/shared/theme/tokens/radii";
import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";
import { focusRing, keyboardFocus } from "../focus";

/**
 * Links em tinta com sublinhado coral. Texto coral sobre papel ou branco fica perto de 3:1,
 * abaixo do AA para texto comum; a cor da marca vai no sublinhado, que não precisa de contraste de texto.
 * Foco visível de teclado em tinta (REQ-DS-005/006, decisão 072).
 */
export const quintalLink: Components<Theme>["MuiLink"] = {
  defaultProps: { underline: "always" },
  styleOverrides: {
    root: {
      color: c.tinta,
      fontWeight: 700,
      textDecorationColor: c.coral,
      textDecorationThickness: 2,
      textUnderlineOffset: 3,
      "&:hover": { textDecorationThickness: 3 },
      [keyboardFocus()]: {
        ...focusRing,
        outlineOffset: 2,
        borderRadius: `${quintalRadii.control}px`,
      },
    },
  },
};
