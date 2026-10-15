import { Box, Typography } from "@mui/material";
import { visuallyHidden } from "../../a11y/visuallyHidden";

export type TimelineStepState = "done" | "current" | "todo";

export interface TimelineStep {
  /** Identificador estável. */
  id: string;
  /** Nome curto da etapa ("Enviado", "Em análise"). */
  label: string;
  state: TimelineStepState;
}

export interface StatusTimelineProps {
  /** Nome acessível da trilha ("Andamento da verificação"). */
  label: string;
  /** Etapas na ordem; uma só `current`. */
  steps: readonly TimelineStep[];
}

/** Estado em texto para o leitor de tela (a marca visual só reforça). */
const STATE_TEXT: Readonly<Record<TimelineStepState, string>> = { done: "feito", current: "agora", todo: "falta" };

function Marker({ state }: { state: TimelineStepState }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 28 28"
      aria-hidden="true"
      sx={(theme) => ({ width: 28, height: 28, flexShrink: 0, color: theme.palette.quintal.tinta })}
    >
      <circle
        cx="14"
        cy="14"
        r="11"
        stroke="currentColor"
        strokeWidth="2.4"
        fill={
          state === "done"
            ? "var(--mui-palette-success-main)"
            : state === "current"
              ? "var(--mui-palette-ceu-main)"
              : "none"
        }
      />
      {state === "done" && (
        <path d="M8.5 14.5l3.6 3.4 7.4-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      )}
      {state === "current" && <circle cx="14" cy="14" r="4" fill="currentColor" />}
    </Box>
  );
}

/**
 * Trilha de status, em ordem, com a etapa de agora destacada (spec 030: Enviado → Em análise → Aprovado). Nunca só a
 * cor: cada etapa diz em texto se foi feita, é agora ou falta, e a atual leva `aria-current="step"`. Sem movimento
 * (status não quica).
 *
 * Quando usar: acompanhar algo que anda sozinho do lado de lá (verificação, estadia 052/054). Quando não usar:
 * passos que a pessoa percorre num formulário (use `WizardProgress`).
 *
 * @example <StatusTimeline label="Andamento da verificação" steps={[{ id: "sent", label: "Enviado", state: "done" }]} />
 */
export function StatusTimeline({ label, steps }: StatusTimelineProps) {
  return (
    <Box
      component="ol"
      aria-label={label}
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1.5, sm: 3 },
      }}
    >
      {steps.map((step) => (
        <Box
          component="li"
          key={step.id}
          aria-current={step.state === "current" ? "step" : undefined}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Marker state={step.state} />
          <Typography component="span" sx={{ fontWeight: step.state === "current" ? 800 : 600 }}>
            {step.label}
          </Typography>
          <Box component="span" sx={visuallyHidden}>
            {`, ${STATE_TEXT[step.state]}`}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
