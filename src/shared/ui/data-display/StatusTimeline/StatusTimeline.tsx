import { Box, Typography } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { visuallyHidden } from "../../a11y/visuallyHidden";

export type TimelineStepState = "done" | "current" | "todo" | "stopped";

export interface TimelineStep {
  /** Identificador estável. */
  id: string;
  /** Nome curto da etapa ("Enviado", "Em análise"). */
  label: string;
  state: TimelineStepState;
  /** Quando aconteceu ou está previsto ("10 de dez., 9h", "dom., 20 de dez."); sem dado, omita. */
  detail?: string | null;
}

export interface StatusTimelineProps {
  /** Nome acessível da trilha ("Andamento da verificação"). */
  label: string;
  /** Etapas na ordem; uma só `current` (ou nenhuma, se terminar em `stopped`). */
  steps: readonly TimelineStep[];
}

const LINE = 2;
/** Marcador menor no celular (390), para as etapas caberem lado a lado. */
const MARKER = { xs: 26, sm: 32 } as const;
const GAP = { xs: 4, sm: 6 } as const;
const STATE_TEXT: Readonly<Record<TimelineStepState, string>> = {
  done: "feito",
  current: "agora",
  todo: "falta",
  stopped: "parou",
};

function Marker({ state }: { state: TimelineStepState }) {
  const size = { xs: MARKER.xs, sm: MARKER.sm };
  const icon = { xs: 14, sm: 18 };
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        position: "relative",
        zIndex: 1,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        width: size,
        height: size,
        boxSizing: "border-box",
        borderRadius: "50%",
        border: `${LINE}px ${state === "todo" ? "dashed" : "solid"} ${theme.palette.quintal.tinta}`,
        bgcolor:
          state === "done"
            ? theme.palette.grama.main
            : state === "current"
              ? theme.palette.gema.main
              : state === "stopped"
                ? theme.palette.primary.main
                : "transparent",
        boxShadow: state === "current" ? `0 0 0 4px ${theme.palette.quintal.luz}` : "none",
        color: theme.palette.quintal.tinta,
      })}
    >
      {(state === "done" || state === "stopped") && (
        <Box component="svg" viewBox="0 0 28 28" sx={{ width: icon, height: icon }}>
          <path
            d={state === "done" ? "M6 14.5l5.2 5 10.8-11" : "M8 8l12 12M20 8L8 20"}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </Box>
      )}
      {state === "current" && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "currentColor" }} />}
    </Box>
  );
}

/**
 * Linha do tempo do app: marcadores ligados por um trilho contínuo, sólido até onde já se chegou e tracejado no que falta.
 * Feito = grama com ✓; agora = gema com anel e a pílula "agora"; falta = contorno tracejado; parou = coral com ✕ (recusada,
 * expirada, cancelada: a trilha acaba ali, sem etapas futuras). Sempre horizontal, em colunas iguais (também no celular),
 * com rótulo e data centralizados embaixo de cada marcador e o trilho atravessando entre eles. Nunca só a cor: cada
 * etapa diz em texto se foi feita, é agora, falta ou parou, e a atual leva `aria-current="step"`. Nada é interativo e
 * nada se mexe.
 *
 * Quando usar: acompanhar algo que anda sozinho do lado de lá (verificação, estadia). Quando não usar: passos que a pessoa
 * percorre num formulário (use `WizardProgress`).
 *
 * @example <StatusTimeline label="Andamento da estadia" steps={[{ id: "ask", label: "Pedido", state: "done", detail: "10 de dez., 9h" }]} />
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
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: "minmax(0, 1fr)",
      }}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const marked = step.state === "current" || step.state === "stopped";
        return (
          <Box
            component="li"
            key={step.id}
            aria-current={step.state === "current" ? "step" : undefined}
            sx={(theme) => ({
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              px: 0.25,
              textAlign: "center",
              ...(!last && {
                "&::after": {
                  content: '""',
                  position: "absolute",
                  height: 0,
                  borderTop: `${LINE}px ${step.state === "done" ? "solid" : "dashed"} ${
                    step.state === "done" ? theme.palette.quintal.tinta : theme.palette.text.secondary
                  }`,
                  // Do marcador ao próximo, passando por cima do espaço entre as colunas.
                  top: { xs: MARKER.xs / 2 - LINE / 2, sm: MARKER.sm / 2 - LINE / 2 },
                  left: {
                    xs: `calc(50% + ${MARKER.xs / 2 + GAP.xs}px)`,
                    sm: `calc(50% + ${MARKER.sm / 2 + GAP.sm}px)`,
                  },
                  right: {
                    xs: `calc(-50% + ${MARKER.xs / 2 + GAP.xs}px)`,
                    sm: `calc(-50% + ${MARKER.sm / 2 + GAP.sm}px)`,
                  },
                },
              }),
            })}
          >
            <Marker state={step.state} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontWeight: marked ? 800 : 700,
                  fontSize: { xs: 14, sm: 16 },
                  lineHeight: 1.25,
                  color: step.state === "todo" ? "text.secondary" : "text.primary",
                }}
              >
                {step.label}
                {marked ? (
                  <Box
                    component="span"
                    sx={(theme) => ({
                      display: "table",
                      mx: "auto",
                      mt: 0.5,
                      px: 1,
                      py: "1px",
                      borderRadius: `${quintalRadii.pill}px`,
                      fontSize: 12,
                      fontWeight: 800,
                      border: `${LINE}px solid ${theme.palette.quintal.tinta}`,
                      bgcolor: step.state === "current" ? theme.palette.gema.main : theme.palette.primary.main,
                    })}
                  >
                    <Box component="span" sx={visuallyHidden}>
                      ,{" "}
                    </Box>
                    {STATE_TEXT[step.state]}
                  </Box>
                ) : (
                  <Box component="span" sx={visuallyHidden}>{`, ${STATE_TEXT[step.state]}`}</Box>
                )}
              </Typography>
              {step.detail && (
                <Typography
                  component="span"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: { xs: 12, sm: 14 }, lineHeight: 1.3, mt: 0.25 }}
                >
                  {step.detail}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
