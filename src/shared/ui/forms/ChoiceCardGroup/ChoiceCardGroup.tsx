"use client";
import { useId } from "react";
import { FormControl, FormLabel, RadioGroup } from "@mui/material";
import { ChoiceCard, type ChoiceCardProps } from "../ChoiceCard";

/** Controlled group of illustrated choices. */
export interface ChoiceCardGroupProps {
  /** Visible legend. */ label: string;
  /** Ordered unique options; checked state comes from value. */ options: readonly Omit<ChoiceCardProps, "checked">[];
  /** Selected option. */ value: string;
  /** Next selected option from click or arrows. */ onChange: (value: string) => void;
  /** Disable all choices. */ disabled?: boolean;
}
/**
 * Accessible native radiogroup for illustrated options.
 * Use for a small visual choice; use SegmentedControl for short text-only choices.
 * @example <ChoiceCardGroup label="Casa" options={options} value={value} onChange={setValue} />
 */
export function ChoiceCardGroup({ label, options, value, onChange, disabled = false }: ChoiceCardGroupProps) {
  const id = useId();
  return (
    <FormControl fullWidth>
      <FormLabel id={id}>{label}</FormLabel>
      <RadioGroup aria-labelledby={id} value={value} onChange={(_, next) => onChange(next)} sx={{ gap: 2, mt: 1 }}>
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            {...option}
            checked={value === option.value}
            disabled={disabled || option.disabled}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
