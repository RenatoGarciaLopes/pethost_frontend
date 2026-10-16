import type { AppearanceOptions } from "@stripe/connect-js";
import type { Theme } from "@mui/material/styles";
/** Appearance do Connect derivada do Quintal; usa valores reais, não theme.vars. Fonte usa fallback do token porque o iframe não conhece as variáveis da página. @example toStripeAppearance(theme) */
export function toStripeAppearance(theme: Theme): AppearanceOptions {
  return {
    variables: {
      colorPrimary: theme.palette.primary.main,
      colorBackground: theme.palette.background.paper,
      colorText: theme.palette.text.primary,
      colorBorder: theme.palette.divider,
      buttonPrimaryColorText: theme.palette.primary.contrastText,
      borderRadius: `${theme.shape.borderRadius}px`,
      fontFamily: theme.typography.fontFamily?.replace(/var\([^,]+,\s*([^)]*)\)/g, "$1"),
    },
  };
}
