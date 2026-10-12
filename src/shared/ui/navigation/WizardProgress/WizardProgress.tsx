"use client";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { OkIcon } from "@/shared/ui/feedback/feedbackIcons";

export interface WizardStep {
  /** Identificador estável do passo. */
  id: string;
  /** Nome curto ("Você", "Onde você mora"). */
  label: string;
}

export type WizardProgressVariant = "trail" | "ring" | "auto";

export interface WizardProgressProps {
  steps: readonly WizardStep[];
  /** Índice (base 0) do passo atual. */
  currentIndex: number;
  /**
   * `trail`: trilha vertical (computador). `ring`: anel "n/total" + "Próximo: …" (celular).
   * `auto` (padrão) escolhe pela largura: anel abaixo do breakpoint `md`.
   */
  variant?: WizardProgressVariant;
  /** Nome acessível da navegação (padrão "Etapas"). */
  label?: string;
}

type StepState = "feito" | "atual" | "falta";

const stateText: Record<StepState, string> = { feito: "concluído", atual: "passo atual", falta: "a fazer" };

/**
 * Progresso de um assistente em passos (REQ-DS-012). O passo atual tem `aria-current="step"`;
 * cada passo diz o estado em texto (não só pela cor). Não navega: só mostra onde a pessoa está.
 *
 * @example <WizardProgress steps={[{ id: "voce", label: "Você" }, { id: "endereco", label: "Onde você mora" }]} currentIndex={0} />
 */
export function WizardProgress({ steps, currentIndex, variant = "auto", label = "Etapas" }: WizardProgressProps) {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down("md"));
  const resolved = variant === "auto" ? (narrow ? "ring" : "trail") : variant;
  const stateOf = (index: number): StepState =>
    index < currentIndex ? "feito" : index === currentIndex ? "atual" : "falta";

  if (resolved === "ring") {
    const total = steps.length;
    const position = Math.min(currentIndex + 1, total);
    const next = steps[currentIndex + 1];
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    return (
      <Box component="nav" aria-label={label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true" focusable="false">
            <circle cx="28" cy="28" r={radius} fill="none" stroke={theme.palette.divider} strokeWidth="6" />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={theme.palette.success.main}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - position / total)}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
            <circle cx="28" cy="28" r={radius + 4} fill="none" stroke={theme.palette.quintal.tinta} strokeWidth="2" />
          </svg>
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
            }}
          >
            {position}/{total}
          </Box>
        </Box>
        <Box>
          <Typography component="p" aria-current="step" sx={{ fontWeight: 800, m: 0 }}>
            <Box component="span" sx={visuallyHidden}>
              Passo {position} de {total}:{" "}
            </Box>
            {steps[currentIndex]?.label}
          </Typography>
          {next ? (
            <Typography component="p" sx={{ color: "text.secondary", fontSize: "0.9rem", m: 0 }}>
              Próximo: {next.label}
            </Typography>
          ) : null}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="nav" aria-label={label}>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0 }}>
        {steps.map((step, index) => {
          const state = stateOf(index);
          const last = index === steps.length - 1;
          return (
            <Box
              component="li"
              key={step.id}
              aria-current={state === "atual" ? "step" : undefined}
              data-state={state}
              sx={{ display: "grid", gridTemplateColumns: "32px 1fr", columnGap: 1.5, minHeight: last ? 32 : 56 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    border: `2px solid ${theme.palette.quintal.tinta}`,
                    backgroundColor:
                      state === "feito"
                        ? theme.palette.success.main
                        : state === "atual"
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                    boxShadow: state === "atual" ? `2px 2px 0 ${theme.palette.quintal.tinta}` : "none",
                    "& svg": { width: 18, height: 18 },
                  }}
                >
                  {state === "feito" ? <OkIcon /> : index + 1}
                </Box>
                {last ? null : (
                  <Box
                    aria-hidden="true"
                    sx={{
                      flex: 1,
                      width: 0,
                      my: 0.5,
                      borderLeft: `2px ${state === "feito" ? "solid" : "dashed"} ${theme.palette.quintal.tinta}`,
                    }}
                  />
                )}
              </Box>
              <Typography
                component="span"
                sx={{
                  pt: "4px",
                  fontWeight: state === "atual" ? 800 : 500,
                  color: state === "falta" ? "text.secondary" : "text.primary",
                }}
              >
                {step.label}
                <Box component="span" sx={visuallyHidden}>
                  {" "}
                  ({stateText[state]})
                </Box>
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

const visuallyHidden = {
  position: "absolute",
  // Em px: no `sx` do MUI, `1` significa 100%.
  width: "1px",
  height: "1px",
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;
