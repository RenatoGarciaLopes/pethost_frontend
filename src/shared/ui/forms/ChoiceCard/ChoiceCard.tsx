"use client";
import type { ReactNode } from "react";
import { Box, ButtonBase, Checkbox, Radio, Typography } from "@mui/material";
import { quintalColors as c } from "../../../theme/tokens/colors";
import { quintalRadii } from "../../../theme/tokens/radii";
import { hardShadow } from "../../../theme/tokens/shadows";
import { SelectedBadge } from "./SelectedBadge";
import { focusRing, keyboardFocus } from "../../../theme/focus";
import { SPRING_ASSENTAR } from "../../../theme/tokens/springs";

/** One native radio (or checkbox) card; group selection is owned by ChoiceCardGroup or CheckCardGroup. */
export interface ChoiceCardProps {
  /** Visible option label. */ label: string;
  /** Stable radio value. */ value: string;
  /** Optional description, included in the accessible name. */ description?: string;
  /** Decorative illustration; supply information in label/description. */ icon?: ReactNode;
  /** Controlled checked state; RadioGroup supplies it when omitted. */ checked?: boolean;
  /** Unavailable option. */ disabled?: boolean;
  /** `radio` (default, inside RadioGroup) or `checkbox` (multiple choice, inside CheckCardGroup). */
  control?: "radio" | "checkbox";
  /** Checkbox only: receives the next checked state. */ onCheckedChange?: (checked: boolean) => void;
  /** `row` (default): icon on the left. `column`: large icon on top, centered (home type); smaller on phones. */
  orientation?: "row" | "column";
  /** `compact`: 56 px tall, check hung on the corner (full width for the text), for grids with many options (species). */
  density?: "regular" | "compact";
}
/**
 * Illustrated native radio (or checkbox) label with a green pressed selection and visible check.
 * Use inside RadioGroup (radio) or CheckCardGroup (checkbox); do not use as a navigation link or unrelated action.
 * @example <ChoiceCard label="Casa" value="house" checked={value === "house"} />
 */
export function ChoiceCard({
  label,
  value,
  description,
  icon,
  checked = false,
  disabled = false,
  control = "radio",
  onCheckedChange,
  orientation = "row",
  density = "regular",
}: ChoiceCardProps) {
  const column = orientation === "column";
  const compact = density === "compact";
  const inputProps = { "aria-label": [label, description].filter(Boolean).join(". ") };
  // Em px: no `sx` do MUI, `1` significa 100% (o input invisível cobria o cartão).
  const hidden = { position: "absolute", width: "1px", height: "1px", padding: 0, opacity: 0 } as const;
  return (
    <ButtonBase
      component="label"
      role={undefined}
      tabIndex={-1}
      disabled={disabled}
      sx={{
        width: "100%",
        minHeight: column ? { xs: 112, sm: 152 } : compact ? 56 : 80,
        p: column ? { xs: 1.5, sm: 2.5 } : compact ? 1.5 : 2,
        gap: column ? 1 : compact ? 1.5 : 2,
        flexDirection: column ? "column" : "row",
        justifyContent: column ? "center" : "flex-start",
        textAlign: column ? "center" : "left",
        border: `2px solid ${c.tinta}`,
        borderRadius: `${quintalRadii.card}px`,
        backgroundColor: checked ? c.grama : "#fff",
        color: c.tinta,
        boxShadow: hardShadow(checked ? 0 : 3),
        transform: checked ? "translate(3px, 3px)" : "none",
        transition: `transform ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
        [keyboardFocus("&:has(input:focus-visible)")]: focusRing,
        "@media (prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
      }}
    >
      {control === "checkbox" ? (
        <Checkbox
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          slotProps={{ input: inputProps }}
          sx={hidden}
        />
      ) : (
        <Radio value={value} checked={checked} disabled={disabled} slotProps={{ input: inputProps }} sx={hidden} />
      )}
      {icon && (
        <Box
          aria-hidden="true"
          // Em coluna, o desenho encolhe no celular para dois cartões caberem lado a lado.
          sx={column ? { lineHeight: 0, "& svg": { width: { xs: 40, sm: 56 }, height: "auto" } } : undefined}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography
          component="span"
          sx={{
            fontWeight: column ? 800 : 700,
            // Compacto em 15 px: no celular (2 colunas, 145 px de texto) "Porquinho-da-índia" cabe numa linha.
            fontSize: column ? { xs: 16, sm: 18 } : compact ? 15 : undefined,
            // Sem hifenização automática: nada de "Porqui-nho".
            hyphens: "manual",
          }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            component="span"
            sx={{
              display: "block",
              ...(column || compact ? { fontSize: 13, fontWeight: 600, color: "text.secondary" } : {}),
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {checked && <SelectedBadge placement={compact ? "corner" : "inside"} />}
    </ButtonBase>
  );
}
