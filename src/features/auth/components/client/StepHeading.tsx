import { Typography } from "@mui/material";
import type { ReactNode, Ref } from "react";

export interface StepHeadingProps {
  /** Recebe o foco quando a etapa troca (`tabIndex={-1}`, sem contorno: o foco é só para o leitor de tela). */
  ref?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}

/**
 * Título (`h1`) de cada etapa das telas de senha (spec 013).
 * @example <StepHeading ref={headingRef}>{passwordCopy.sent.title}</StepHeading>
 */
export function StepHeading({ ref, children }: StepHeadingProps) {
  return (
    <Typography
      ref={ref}
      variant="h1"
      tabIndex={-1}
      sx={{ fontSize: { xs: 28, md: 36 }, "&:focus": { outline: "none" } }}
    >
      {children}
    </Typography>
  );
}
