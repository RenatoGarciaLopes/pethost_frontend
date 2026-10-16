import { Box, Button, Stack, Typography } from "@mui/material";
import { useId } from "react";
import { StatusPill, type StatusPillTone } from "@/shared/ui/feedback/StatusPill";
import { Surface } from "@/shared/ui/layout/Surface";
import { hostOnboardingCopy as copy } from "../lib/hostOnboardingCopy";
import { hostStages, type HostProgress, type StageState } from "../lib/hostStages";

const TONE: Readonly<Record<StageState, StatusPillTone>> = { current: "info", done: "ok", locked: "neutro" };

export interface HostOnboardingStagesProps {
  /** Onde o anfitrião está: verificação, recebimento e cantinho. */
  progress: HostProgress;
}

/**
 * As três etapas para virar anfitrião, em ordem (REQ-HVER-001, REQ-LIST-001): 1. Mostrar quem eu sou → 2. Como eu
 * recebo → 3. Montar meu cantinho. Cada etapa só abre quando a anterior termina; a da vez traz o caminho
 * (`aria-current="step"`) e a travada diz o que falta. O estado vem em texto; o selo só reforça. Apresentação pura.
 *
 * @example <HostOnboardingStages progress={{ verified: true, payouts: { enabled: false, status: "in_progress" }, hasListing: false }} />
 */
export function HostOnboardingStages({ progress }: HostOnboardingStagesProps) {
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography id={headingId} variant="h2" sx={{ fontSize: { xs: 22, md: 24 }, mb: 2 }}>
        {copy.heading}
      </Typography>
      <Box
        component="ol"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {hostStages(progress).map((stage, index) => (
          <Surface
            component="li"
            key={stage.title}
            elevation="sm"
            aria-current={stage.state === "current" ? "step" : undefined}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: 0,
              color: stage.state === "locked" ? "text.secondary" : "text.primary",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
              <Box
                aria-hidden="true"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </Box>
              <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {stage.title}
              </Typography>
              <StatusPill label={copy.states[stage.state]} tone={TONE[stage.state]} size="sm" />
            </Stack>
            <Typography variant="body2">{stage.text}</Typography>
            {stage.action && (
              <Box>
                <Button href={stage.action.href} variant="outlined" size="small">
                  {stage.action.label}
                </Button>
              </Box>
            )}
          </Surface>
        ))}
      </Box>
    </Box>
  );
}
