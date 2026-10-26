"use client";
import { useId, useRef, type KeyboardEvent } from "react";
import { FormControl, FormLabel, ToggleButton, ToggleButtonGroup } from "@mui/material";

/** One short mutually exclusive option. */
export interface SegmentedOption {
  /** Stable controlled value. */ value: string;
  /** Visible label. */ label: string;
  /** Prevent selecting an unavailable option. */ disabled?: boolean;
}
/** Controlled accessible segmented choice; intended for two to four short options. */
export interface SegmentedControlProps {
  /** Visible group label. */ label: string;
  /** Ordered options with unique values. */ options: readonly SegmentedOption[];
  /** Selected option's value. */ value: string;
  /** Receives the next selected value. */ onChange: (value: string) => void;
  /** Fill the container width. */ fullWidth?: boolean;
  /** Disable the whole group. */ disabled?: boolean;
}
/**
 * Exclusive MUI segmented choice with radio arrow/Home/End navigation.
 * Use for short choices; use ChoiceCardGroup for illustrated options.
 * @example <SegmentedControl label="Resposta" options={options} value={value} onChange={setValue} />
 */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  fullWidth = false,
  disabled = false,
}: SegmentedControlProps) {
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const enabled = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
    const position = enabled.findIndex(({ index }) => index === current);
    let target: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = (position + 1) % enabled.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = (position - 1 + enabled.length) % enabled.length;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = enabled.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    const next = enabled[target];
    onChange(next.option.value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next.index]?.focus();
  }
  return (
    <FormControl fullWidth={fullWidth}>
      {/* Rótulo de grupo no peso dos rótulos de campo (prancha telas-conta: "Você entra como"). */}
      <FormLabel id={id} sx={{ fontWeight: 700 }}>
        {label}
      </FormLabel>
      <ToggleButtonGroup
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={id}
        exclusive
        value={value}
        fullWidth={fullWidth}
        onChange={(_, next: string | null) => {
          if (next !== null) onChange(next);
        }}
      >
        {options.map((option, index) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            role="radio"
            aria-checked={value === option.value}
            aria-pressed={undefined}
            tabIndex={
              value === option.value || (!value && index === options.findIndex((item) => !item.disabled)) ? 0 : -1
            }
            disabled={disabled || option.disabled}
            onKeyDown={(event) => handleKeyDown(event, index)}
            sx={{ flex: fullWidth ? 1 : undefined }}
          >
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
}
