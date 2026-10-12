"use client";
import { Box, Chip, Typography } from "@mui/material";

/** Text snippets picked by the consuming field, never stored internally. */
export interface ChipPickerProps {
  /** Visible group heading. */ label: string;
  /** Unique text snippets. */ options: readonly string[];
  /** Snippets already present in the consuming value. */ selected?: readonly string[];
  /** Receives picked text; caller owns insertion and duplicate handling. */ onPick: (text: string) => void;
  /** Disable all suggestions. */ disabled?: boolean;
}
/**
 * Accessible quick-insert chips. Use alongside a free-text field, not as radio choices.
 * @example <ChipPicker label="Atalhos" options={options} onPick={insertText} />
 */
export function ChipPicker({ label, options, selected = [], onPick, disabled = false }: ChipPickerProps) {
  return (
    <Box role="group" aria-label={label}>
      <Typography sx={{ fontWeight: 700 }} gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {options.map((text) => {
          const isSelected = selected.includes(text);
          return (
            <Chip
              key={text}
              label={
                <>
                  <span aria-hidden="true">{isSelected ? "✓ " : "+ "}</span>
                  {text}
                </>
              }
              clickable
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onPick(text)}
              variant={isSelected ? "ok" : "outlined"}
              sx={{ borderStyle: isSelected ? "solid" : "dashed" }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
