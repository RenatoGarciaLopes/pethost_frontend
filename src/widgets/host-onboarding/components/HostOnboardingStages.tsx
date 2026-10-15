import { Box, Stack, Typography } from "@mui/material";
import { useId } from "react";
import { StatusPill, type StatusPillTone } from "@/shared/ui/feedback/StatusPill";
import { hostOnboardingCopy as copy } from "../lib/hostOnboardingCopy";

type StageState = keyof typeof copy.states;

interface Stage {
  title: string;
  state: StageState;
  text: string;
}

const TONE: Readonly<Record<StageState, StatusPillTone>> = {
  current: "info",
  done: "ok",
  unlocked: "info",
  locked: "neutro",
};

function stagesFor(verificationApproved: boolean): Stage[] {
  const { verification, payout, listing } = copy.stages;
  return [
    verificationApproved
      ? { title: verification.title, state: "done", text: verification.done }
      : { title: verification.title, state: "current", text: verification.current },
    verificationApproved
      ? { title: payout.title, state: "unlocked", text: payout.unlocked }
      : { title: payout.title, state: "locked", text: payout.locked },
    { title: listing.title, state: "locked", text: listing.locked },
  ];
}

export interface HostOnboardingStagesProps {
  /** A verificação (etapa 1) foi aprovada: libera a etapa 2. */
  verificationApproved: boolean;
}

/**
 * As três etapas para virar anfitrião, em ordem (REQ-HVER-001): 1. Mostrar quem eu sou → 2. Como eu recebo → 3.
 * Montar meu cantinho. Cada etapa só abre quando a anterior termina; a travada diz o que falta, e o estado vem em
 * texto (o selo só reforça). A etapa de agora leva `aria-current="step"`. Apresentação pura; 043 e 044 ligam as
 * etapas 2 e 3.
 *
 * @example <HostOnboardingStages verificationApproved={false} />
 */
export function HostOnboardingStages({ verificationApproved }: HostOnboardingStagesProps) {
  const headingId = useId();
  const stages = stagesFor(verificationApproved);
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
        {stages.map((stage, index) => (
          <Stack
            component="li"
            key={stage.title}
            spacing={1}
            aria-current={stage.state === "current" || stage.state === "unlocked" ? "step" : undefined}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "2px solid",
              borderColor: stage.state === "locked" ? "divider" : "text.primary",
              bgcolor: "background.paper",
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
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
