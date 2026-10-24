import { Box, Typography } from "@mui/material";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import type { StayTrailStep } from "../../lib/stayDetailView";

const MARKER = 32;
const STATE_TEXT = { done: "feito", current: "agora", todo: "falta" } as const;

function Marker({ state }: { state: StayTrailStep["state"] }) {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: "relative",
        zIndex: 1,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        width: MARKER,
        height: MARKER,
        borderRadius: "50%",
        border: `2.4px ${state === "todo" ? "dashed" : "solid"} ${theme.palette.quintal.tinta}`,
        bgcolor:
          state === "done" ? theme.palette.grama.main : state === "current" ? theme.palette.gema.main : "transparent",
        boxShadow: state === "current" ? `0 0 0 4px ${theme.palette.quintal.luz}` : "none",
        color: theme.palette.quintal.tinta,
      })}
    >
      {state === "done" && (
        <Box component="svg" viewBox="0 0 28 28" sx={{ width: 20, height: 20 }}>
          <path d="M7 14.5l4.6 4.4 9-9.6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </Box>
      )}
      {state === "current" && (
        <Box sx={(theme) => ({ width: 10, height: 10, borderRadius: "50%", bgcolor: theme.palette.primary.main })} />
      )}
    </Box>
  );
}

export interface StayTimelineProps {
  /** Nome acessível ("Andamento da estadia"). */
  label: string;
  /** Marcos em ordem; um só `current`. */
  steps: readonly StayTrailStep[];
}

/**
 * A linha do tempo da estadia (spec 097): trilho horizontal no desktop e vertical no celular, com os marcos ligados por
 * uma linha (cheia até onde já foi, tracejada no que falta). Feito = grama com ✓ e o momento; atual = gema com anel e
 * rótulo em negrito; futuro = tracejado e apagado, com o dia previsto. Lista ordenada; a etapa atual leva
 * `aria-current="step"` e cada etapa diz em texto se foi feita, é agora ou falta. Sem movimento.
 *
 * @example <StayTimeline label="Andamento da estadia" steps={stayTrail(booking)!} />
 */
export function StayTimeline({ label, steps }: StayTimelineProps) {
  return (
    <Box
      component="ol"
      aria-label={label}
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "grid",
        gridAutoFlow: { xs: "row", sm: "column" },
        gridAutoColumns: { sm: "1fr" },
        rowGap: { xs: 2.5, sm: 0 },
      }}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <Box
            component="li"
            key={step.id}
            aria-current={step.state === "current" ? "step" : undefined}
            sx={(theme) => ({
              position: "relative",
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 1.5, sm: 1 },
              textAlign: { xs: "left", sm: "center" },
              ...(!last && {
                "&::after": {
                  content: '""',
                  position: "absolute",
                  borderColor: theme.palette.quintal.tinta,
                  borderStyle: step.state === "done" ? "solid" : "dashed",
                  borderWidth: 0,
                  // Vertical (celular): do marcador até o próximo; horizontal: de um marcador ao outro.
                  borderLeftWidth: { xs: "2.4px", sm: 0 },
                  borderTopWidth: { xs: 0, sm: "2.4px" },
                  left: { xs: MARKER / 2 - 1.2, sm: `calc(50% + ${MARKER / 2 + 6}px)` },
                  top: { xs: MARKER + 4, sm: MARKER / 2 - 1.2 },
                  bottom: { xs: -14, sm: "auto" },
                  right: { xs: "auto", sm: `calc(-50% + ${MARKER / 2 + 6}px)` },
                },
              }),
            })}
          >
            <Marker state={step.state} />
            <Box>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontWeight: step.state === "current" ? 800 : 600,
                  color: step.state === "todo" ? "text.secondary" : "text.primary",
                }}
              >
                {step.label}
                <Box component="span" sx={visuallyHidden}>{`, ${STATE_TEXT[step.state]}`}</Box>
              </Typography>
              {step.when && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block" }}>
                  {step.when}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
