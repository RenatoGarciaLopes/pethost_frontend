import { Box, type BoxProps } from "@mui/material";
import type { ElementType } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";

export type SurfaceElevation = "sm" | "md" | "lg";

export interface SurfaceProps extends BoxProps {
  /** Hard shadow offset: 3, 5 or 8 pixels. */
  elevation?: SurfaceElevation;
  /** Adds raised hover and pressed feedback for a surface inside a link or button. */
  interactive?: boolean;
  /** Root element for semantic composition. */
  component?: ElementType;
}

const offsets: Record<SurfaceElevation, 3 | 5 | 8> = { sm: 3, md: 5, lg: 8 };

/**
 * Quintal surface with consistent paper background, ink border, card radius and hard shadow.
 * @example <Surface component="article" elevation="md">Resumo</Surface>
 */
export function Surface({ elevation = "sm", interactive = false, component = "div", sx, ...props }: SurfaceProps) {
  return (
    <Box
      {...props}
      component={component}
      data-surface
      data-interactive={interactive || undefined}
      data-elevation={elevation}
      sx={[
        {
          bgcolor: "background.paper",
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.card}px`,
          boxShadow: hardShadow(offsets[elevation]),
          ...(interactive && {
            transition: "transform 120ms ease, box-shadow 120ms ease",
            "&:hover": { transform: "translateY(-1px)", boxShadow: hardShadow(5) },
            "&:active": { transform: "translateY(1px)", boxShadow: hardShadow(0) },
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
