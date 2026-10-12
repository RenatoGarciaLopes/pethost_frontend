"use client";
import { useId, type ReactNode } from "react";
import { Box, FormControlLabel, Switch } from "@mui/material";
import { usePrefersReducedMotion } from "../../../lib/motion/usePrefersReducedMotion";
import { SPRING_ASSENTAR } from "../../../theme/tokens/springs";

/** Controlled switch with optional dependent content. */
export interface ToggleRowProps {
  /** Visible switch label. */ label: string;
  /** Whether dependent content is revealed. */ checked: boolean;
  /** Receives checked state. */ onChange: (checked: boolean) => void;
  /** Content mounted only when checked. */ children?: ReactNode;
  /** Prevent interaction. */ disabled?: boolean;
}
/**
 * A labeled switch revealing related fields without blocking interaction.
 * Use for optional sections, not mutually exclusive choices.
 * @example <ToggleRow label="Observação?" checked={checked} onChange={setChecked}>{field}</ToggleRow>
 */
export function ToggleRow({ label, checked, onChange, children, disabled = false }: ToggleRowProps) {
  const id = useId();
  const isReduced = usePrefersReducedMotion();
  return (
    <Box>
      <FormControlLabel
        label={label}
        control={
          <Switch
            checked={checked}
            disabled={disabled}
            onChange={(_, next) => onChange(next)}
            slotProps={{
              input: { role: "switch", "aria-controls": checked ? id : undefined, "aria-expanded": checked },
            }}
          />
        }
      />
      {checked && (
        <Box
          id={id}
          sx={{
            transformOrigin: "top",
            animation: isReduced ? "none" : `quintal-reveal ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
            "@keyframes quintal-reveal": {
              from: { opacity: 0, transform: "translateY(-4px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
