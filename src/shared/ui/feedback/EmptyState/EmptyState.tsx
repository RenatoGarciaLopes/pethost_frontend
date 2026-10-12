"use client";
import { Box, Typography } from "@mui/material";
import type { ElementType, ReactNode } from "react";
import { Daisy } from "@/shared/ui/brand/Daisy";
import { GroundLine } from "@/shared/ui/brand/GroundLine";

export interface EmptyStateProps {
  /** Frase principal, convidando ao próximo passo ("Ainda não tem pet por aqui."). */
  title: ReactNode;
  /** Explicação curta. */
  description?: ReactNode;
  /** Ação principal (ex.: botão "Apresentar meu pet"). */
  action?: ReactNode;
  /** Ilustração própria; o padrão é um canteiro com margaridas. Sempre decorativa. */
  illustration?: ReactNode;
  /** Nível do título na página (padrão `h2`). */
  headingComponent?: ElementType;
}

/**
 * Estado vazio (REQ-DS-014): cena pequena, título em Caprasimo e o próximo passo.
 * Vazio nunca é triste: é um convite (vault `design/15-estados-com-e-sem-pet.md`).
 *
 * @example <EmptyState title="Ainda não tem pet por aqui." action={<Button>Apresentar meu pet</Button>} />
 */
export function EmptyState({ title, description, action, illustration, headingComponent = "h2" }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
        py: 4,
        px: 2,
        maxWidth: 480,
        mx: "auto",
      }}
    >
      <Box aria-hidden="true" sx={{ width: 200, mb: 1 }}>
        {illustration ?? <DefaultGarden />}
      </Box>
      <Typography component={headingComponent} variant="h3">
        {title}
      </Typography>
      {description ? (
        <Typography component="p" sx={{ color: "text.secondary", m: 0 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

function DefaultGarden() {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 2, mb: "-14px" }}>
        <Daisy size={54} petal="branco" />
        <Daisy size={42} petal="ceu" delayMs={600} />
        <Daisy size={48} petal="coral" delayMs={1200} />
      </Box>
      <GroundLine height={22} />
    </Box>
  );
}
