"use client";
import type { ReactNode } from "react";
import { Box, ButtonBase, Radio, Typography } from "@mui/material";
import { quintalColors as c } from "../../../theme/tokens/colors";
import { quintalRadii } from "../../../theme/tokens/radii";
import { hardShadow } from "../../../theme/tokens/shadows";
import { focusRing } from "../../../theme/overrides/Button";
import { SPRING_ASSENTAR } from "../../../theme/tokens/springs";

/** One native radio card; group selection should be owned by ChoiceCardGroup. */
export interface ChoiceCardProps {
  /** Visible option label. */ label: string;
  /** Stable radio value. */ value: string;
  /** Optional description, included in the accessible name. */ description?: string;
  /** Decorative illustration; supply information in label/description. */ icon?: ReactNode;
  /** Controlled checked state; RadioGroup supplies it when omitted. */ checked?: boolean;
  /** Unavailable option. */ disabled?: boolean;
}
/**
 * Illustrated native radio label with a green pressed selection and visible check.
 * Use inside RadioGroup; do not use as a navigation link or unrelated action.
 * @example <ChoiceCard label="Casa" value="house" checked={value === "house"} />
 */
export function ChoiceCard({ label, value, description, icon, checked = false, disabled = false }: ChoiceCardProps) {
  return (
    <ButtonBase
      component="label"
      role={undefined}
      tabIndex={-1}
      disabled={disabled}
      sx={{
        width: "100%",
        minHeight: 80,
        p: 2,
        gap: 2,
        justifyContent: "flex-start",
        textAlign: "left",
        border: `2px solid ${c.tinta}`,
        borderRadius: `${quintalRadii.card}px`,
        backgroundColor: checked ? c.grama : "#fff",
        color: c.tinta,
        boxShadow: hardShadow(checked ? 0 : 3),
        transform: checked ? "translate(3px, 3px)" : "none",
        transition: `transform ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
        "&:has(input:focus-visible)": focusRing,
        "@media (prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
      }}
    >
      <Radio
        value={value}
        checked={checked}
        disabled={disabled}
        slotProps={{ input: { "aria-label": [label, description].filter(Boolean).join(". ") } }}
        sx={{ position: "absolute", width: 1, height: 1, padding: 0, opacity: 0 }}
      />
      {icon && <Box aria-hidden="true">{icon}</Box>}
      <Box>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        {description && (
          <Typography component="span" sx={{ display: "block" }}>
            {description}
          </Typography>
        )}
      </Box>
      {checked && (
        <Box component="span" aria-hidden="true" sx={{ ml: "auto" }}>
          ✓
        </Box>
      )}
    </ButtonBase>
  );
}
