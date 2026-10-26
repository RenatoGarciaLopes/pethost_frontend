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
  /**
   * `responsive`: equal columns from md, stacked on mobile. `row`: equal columns at every width (two short choices).
   * `grid`: compact 56 px cards in `columns`, equal widths and equal row heights (long lists: the 12 species, 107).
   */
  layout?: "stacked" | "responsive" | "row" | "grid";
  /** `grid` only: columns per breakpoint (default 2 on phones, 3 from `md`, like CheckCardGroup's species). */
  columns?: { xs: number; sm?: number; md?: number };
  /** Section heading for the visible group label; body preserves existing forms. */ labelVariant?: "body" | "section";
  /** Disable all choices. */ disabled?: boolean;
}
/**
 * Accessible native radiogroup for illustrated options.
 * Use for a small visual choice; use SegmentedControl for short text-only choices.
 * @example <ChoiceCardGroup label="Casa" options={options} value={value} onChange={setValue} />
 */
export function ChoiceCardGroup({
  label,
  options,
  value,
  onChange,
  disabled = false,
  layout = "stacked",
  columns = { xs: 2, md: 3 },
  labelVariant = "body",
}: ChoiceCardGroupProps) {
  const id = useId();
  return (
    <FormControl fullWidth>
      <FormLabel
        id={id}
        component={labelVariant === "section" ? "h2" : "label"}
        sx={
          labelVariant === "section"
            ? { typography: "h2", fontSize: 20, fontWeight: 700, color: "text.primary" }
            : // No peso dos rótulos de campo do tema (TextField), como os grupos da prancha.
              { fontWeight: 700 }
        }
      >
        {label}
      </FormLabel>
      <RadioGroup
        aria-labelledby={id}
        value={value}
        onChange={(_, next) => onChange(next)}
        sx={{
          gap: 2,
          mt: 1,
          ...(layout === "responsive" && {
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: `repeat(${options.length}, minmax(0, 1fr))` },
          }),
          ...(layout === "row" && {
            display: "grid",
            gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          }),
          ...(layout === "grid" && {
            display: "grid",
            gap: 1.5,
            // Linhas da mesma altura: a mais alta (rótulo de duas linhas) dita todas, como no CheckCardGroup.
            gridAutoRows: "1fr",
            gridTemplateColumns: Object.fromEntries(
              Object.entries(columns).map(([breakpoint, count]) => [breakpoint, `repeat(${count}, minmax(0, 1fr))`]),
            ),
          }),
        }}
      >
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            {...option}
            density={layout === "grid" ? "compact" : option.density}
            checked={value === option.value}
            disabled={disabled || option.disabled}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
