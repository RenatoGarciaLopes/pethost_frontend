"use client";
import { useId, type Ref } from "react";
import { Box, FormHelperText, Typography } from "@mui/material";
import { ChoiceCard, type ChoiceCardProps } from "../ChoiceCard";

type CheckCardOption = Pick<ChoiceCardProps, "value" | "label" | "description" | "icon" | "disabled">;

/** Controlled multiple choice in illustrated cards. */
export interface CheckCardGroupProps {
  /** Visible legend (the group's accessible name). */ label: string;
  /** Ordered unique options. */ options: readonly CheckCardOption[];
  /** Checked values, in any order. */ value: readonly string[];
  /** Receives the checked values in the options' order. */ onChange: (value: string[]) => void;
  /** Columns per breakpoint (default 1 on phones, 2 from `sm`). */ columns?: { xs: number; sm?: number; md?: number };
  /** `compact` cards (56 px) for long lists. */ density?: ChoiceCardProps["density"];
  /** Error already in Portuguese; describes the group. */ error?: string;
  /** Disable all choices. */ disabled?: boolean;
  /** Receives focus when there is an error (the group accepts programmatic focus). */ ref?: Ref<HTMLFieldSetElement>;
}

/**
 * Accessible group of checkbox cards (`fieldset` + `legend`): the multiple-choice sibling of ChoiceCardGroup, with
 * the same green pressed selection and visible check. Returns values in the options' order.
 * Use for a few illustrated or short options where more than one can be picked (species a host accepts, sizes);
 * use ChoiceCardGroup for one answer and ChipPicker to insert text into a field.
 * @example <CheckCardGroup label="Portes" options={sizes} value={value} onChange={setValue} />
 */
export function CheckCardGroup({
  label,
  options,
  value,
  onChange,
  columns = { xs: 1, sm: 2 },
  density,
  error,
  disabled = false,
  ref,
}: CheckCardGroupProps) {
  const id = useId();
  const errorId = `${id}-erro`;
  const toggle = (option: string, checked: boolean) =>
    onChange(options.map((item) => item.value).filter((item) => (item === option ? checked : value.includes(item))));
  return (
    <Box
      component="fieldset"
      ref={ref}
      tabIndex={-1}
      aria-describedby={error ? errorId : undefined}
      sx={{ border: 0, m: 0, p: 0, minWidth: 0, "&:focus": { outline: "none" } }}
    >
      <Typography component="legend" sx={{ p: 0, fontWeight: 700 }}>
        {label}
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: Object.fromEntries(
            Object.entries(columns).map(([breakpoint, count]) => [breakpoint, `repeat(${count}, minmax(0, 1fr))`]),
          ),
        }}
      >
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            {...option}
            control="checkbox"
            density={density}
            checked={value.includes(option.value)}
            disabled={disabled || option.disabled}
            onCheckedChange={(checked) => toggle(option.value, checked)}
          />
        ))}
      </Box>
      {error && (
        <FormHelperText id={errorId} error sx={{ mx: 0, mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}
