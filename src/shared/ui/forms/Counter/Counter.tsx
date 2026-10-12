"use client";
import { useId } from "react";
import { Box, Button, Typography } from "@mui/material";
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
/**
 * Two accessible actions for a bounded integer; buttons stop at min/max.
 * Use for small counts, not arbitrary numeric/decimal text entry.
 * @example <Counter label="Capacidade" value={value} min={1} max={5} onChange={setValue} />
 */
export function Counter({ label, value, min, max, onChange, disabled = false }: CounterProps) {
  const id = useId();
  return (
    <Box role="group" aria-labelledby={id}>
      <Typography id={id} sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          type="button"
          aria-label={`${formCopy.decrease} ${label}`}
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </Button>
        <Box component="output" aria-live="polite" aria-label={label}>
          {value}
        </Box>
        <Button
          type="button"
          aria-label={`${formCopy.increase} ${label}`}
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </Button>
      </Box>
    </Box>
  );
}
