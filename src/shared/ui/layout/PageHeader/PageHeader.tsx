import { Box, Typography } from "@mui/material";
import type { ReactNode, Ref } from "react";

export interface PageHeaderProps {
  /** Main page heading, rendered as the page h1. */
  title: string;
  /** Optional context below the heading. */
  subtitle?: string;
  /** Page actions; aligned to the right on desktop and below the title on mobile. */
  actions?: ReactNode;
  /** Optional focus target when a screen changes state, such as password recovery. */
  headingRef?: Ref<HTMLHeadingElement>;
}

/**
 * Standard page heading with optional subtitle and responsive action placement.
 * @example <PageHeader title="Seus pedidos" actions={<Button>Ver todos</Button>} />
 */
export function PageHeader({ title, subtitle, actions, headingRef }: PageHeaderProps) {
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
        <Typography
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          component="h1"
          variant="h1"
          sx={{ fontSize: { xs: 30, md: 40 }, m: 0 }}
        >
          {title}
        </Typography>
        {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {actions ? (
        <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: { md: "1" }, justifySelf: { md: "end" } }}>{actions}</Box>
      ) : null}
    </Box>
  );
}
