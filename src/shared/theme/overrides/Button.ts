import { quintalRadii } from "@/shared/theme/tokens/radii";
import type { Components, Theme } from "@mui/material/styles";
import { quietVariant } from "../variants/quintalVariants";
import { quintalColors as c } from "../tokens/colors";
import { hardShadow } from "../tokens/shadows";
import { SPRING_ASSENTAR } from "../tokens/springs";
/** Universal visible focus ring; applies to keyboard interaction only. */
export const focusRing = { outline: `3px solid ${c.tinta}`, outlineOffset: "3px" };
/** Quintal button geometry, press feedback and reduced-motion behavior. */
export const buttonStyles = {
  minHeight: 48,
  border: `2px solid ${c.tinta}`,
  borderRadius: `${quintalRadii.field}px`,
  boxShadow: hardShadow(3),
  padding: "10px 24px",
  textTransform: "none" as const,
  color: c.tinta,
  transition: `transform ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}, box-shadow ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
  "&:hover": { transform: "translateY(-1px)", boxShadow: hardShadow(5), border: `2px solid ${c.tinta}` },
  "&:active": { transform: "translate(3px, 3px)", boxShadow: hardShadow(0) },
  "&:focus-visible": focusRing,
  "&.Mui-disabled": { color: c.texto2, backgroundColor: c.linha, boxShadow: "none" },
  "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover, &:active": { transform: "none" } },
};

/** Quintal Button styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalButton = {
  defaultProps: { disableElevation: true },
  styleOverrides: {
    root: buttonStyles,
    contained: { minHeight: 56 },
    colorPrimary: {
      color: c.tinta,
      "&.MuiButton-contained": { backgroundColor: c.coral, "&:hover": { backgroundColor: c.coral } },
    },
  },
  variants: [quietVariant],
} satisfies Components<Theme>["MuiButton"];
