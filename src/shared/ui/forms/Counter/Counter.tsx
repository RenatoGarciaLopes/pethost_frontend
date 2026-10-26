"use client";
import { useId } from "react";
import { Box, Button, Typography } from "@mui/material";
import { SPRING_ASSENTAR } from "../../../theme/tokens/springs";
import { formCopy } from "../formCopy";

/** Integer control bounded by consumer-owned limits. */
export interface CounterProps {
  /** Visible name and basis of action labels. */ label: string;
  /** Current integer within the inclusive limits. */ value: number;
  /** Inclusive minimum. */ min: number;
  /** Inclusive maximum. */ max: number;
  /** Receives next integer. */ onChange: (value: number) => void;
  /** Disable both actions. */ disabled?: boolean;
}

const step = {
  minWidth: 48,
  width: 48,
  height: 48,
  minHeight: 48,
  p: 0,
  fontSize: 24,
  fontWeight: 800,
  bgcolor: "#fff",
};

/**
 * Two accessible actions for a bounded integer; buttons stop at min/max. Quintal table (note 17): "− number +"
 * with 48 px buttons and the number large, settling in on each change (no motion with reduced motion).
 * Use for small counts, not arbitrary numeric/decimal text entry.
 * @example <Counter label="Capacidade" value={value} min={1} max={5} onChange={setValue} />
 */
export function Counter({ label, value, min, max, onChange, disabled = false }: CounterProps) {
  const id = useId();
  return (
    <Box role="group" aria-labelledby={id}>
      <Typography id={id} sx={{ fontWeight: 700, mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          type="button"
          aria-label={`${formCopy.decrease} ${label}`}
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          sx={step}
        >
          −
        </Button>
        <Box
          component="output"
          aria-live="polite"
          aria-label={label}
          sx={{
            minWidth: "2.5ch",
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontSize: 32,
            lineHeight: 1,
          }}
        >
          <Box
            component="span"
            key={value}
            sx={{
              display: "inline-block",
              animation: `quintal-counter ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
              "@keyframes quintal-counter": {
                from: { opacity: 0.2, transform: "translateY(-6px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {value}
          </Box>
        </Box>
        <Button
          type="button"
          aria-label={`${formCopy.increase} ${label}`}
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          sx={step}
        >
          +
        </Button>
      </Box>
    </Box>
  );
}
