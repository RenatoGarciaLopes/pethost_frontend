import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Main page heading, rendered as the page h1. */
  title: ReactNode;
  /** Optional overline above the heading (context such as who asked and until when); not part of the h1 name. */
  eyebrow?: ReactNode;
  /** Optional context below the heading. */
  subtitle?: ReactNode;
  /** Page actions; aligned to the right on desktop and below the title on mobile. */
  actions?: ReactNode;
}

/**
 * Standard page heading with optional overline, subtitle and responsive action placement.
 * @example <PageHeader eyebrow="Pedido de Camila" title="Pipoca quer passar 5 noites aqui." />
 */
export function PageHeader({ title, eyebrow, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: actions ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)" },
        gap: 2,
        alignItems: "end",
      }}
    >
      <Box>
        {eyebrow ? (
          <Typography
            component="div"
            variant="overline"
            sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1, color: "text.secondary" }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, m: 0 }}>
          {title}
        </Typography>
        {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {actions ? <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: { md: "1" } }}>{actions}</Box> : null}
    </Box>
  );
}
