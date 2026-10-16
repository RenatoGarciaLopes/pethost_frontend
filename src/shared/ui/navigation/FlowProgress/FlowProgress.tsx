"use client";

import { Box, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { OkIcon } from "@/shared/ui/feedback/feedbackIcons";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";

export interface FlowStep {
  /** Stable step identifier. */
  id: string;
  /** Short visible step name. */
  label: string;
  /** One-line desktop explanation. */
  description?: string;
}

export interface FlowProgressProps {
  /** Ordered steps in the flow. */
  steps: readonly FlowStep[];
  /** Stable identifier of the current step. */
  current: string;
  /** Step IDs that have been completed. */
  completed?: readonly string[];
  /** Accessible name for the navigation landmark. */
  label?: string;
}

/**
 * Responsive progress for multi-step flows: detailed vertical trail on desktop and compact ring on mobile.
 * @example <FlowProgress steps={steps} current="profile" completed={["account"]} />
 */
export function FlowProgress({ steps, current, completed = [], label = "Etapas do cadastro" }: FlowProgressProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === current),
  );
  const total = steps.length;
  const position = total === 0 ? 0 : currentIndex + 1;
  const currentStep = steps[currentIndex];
  const nextStep = steps[currentIndex + 1];
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) return null;

  return (
    <Box component="nav" aria-label={label}>
      {mobile ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
              aria-hidden
              sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontWeight: 800 }}
            >
              {position}/{total}
            </Box>
          </Box>
          <Box>
            <Typography component="p" sx={{ fontWeight: 800, m: 0 }}>
              <Box
                component="span"
                sx={visuallyHidden}
              >{`Passo ${position} de ${total} · ${currentStep?.label}. `}</Box>
              {currentStep?.label}
            </Typography>
            {nextStep ? (
              <Typography
                component="p"
                sx={{ color: "text.secondary", fontSize: "0.9rem", m: 0 }}
              >{`Próximo: ${nextStep.label}`}</Typography>
            ) : null}
          </Box>
        </Box>
      ) : (
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
          {steps.map((step, index) => {
            const isCurrent = step.id === current;
            const isComplete = completed.includes(step.id);
            const state = isCurrent ? "atual" : isComplete ? "concluído" : "a seguir";
            return (
              <Box
                component="li"
                key={step.id}
                aria-current={isCurrent ? "step" : undefined}
                data-state={state}
                sx={{ display: "grid", gridTemplateColumns: "36px minmax(0, 1fr)", gap: 1.5 }}
              >
                <Box sx={{ display: "grid", justifyItems: "center", gridTemplateRows: "36px 1fr" }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 36,
                      height: 36,
                      border: "2px solid",
                      borderColor: isComplete ? "success.main" : "text.primary",
                      borderRadius: "50%",
                      bgcolor: isComplete ? "success.main" : isCurrent ? "primary.main" : "background.paper",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {isComplete ? <OkIcon /> : index + 1}
                  </Box>
                  {index < total - 1 ? (
                    <Box
                      aria-hidden
                      sx={{
                        width: 0,
                        minHeight: 24,
                        borderLeft: "2px solid",
                        borderColor: isComplete ? "success.main" : "divider",
                      }}
                    />
                  ) : null}
                </Box>
                <Box sx={{ pt: 0.5 }}>
                  <Typography component="p" sx={{ fontWeight: isCurrent ? 800 : 600, m: 0 }}>
                    {step.label}
                    <Box component="span" sx={visuallyHidden}>{` (${state})`}</Box>
                  </Typography>
                  {step.description ? (
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
