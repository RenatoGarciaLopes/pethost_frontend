"use client";
import { Box } from "@mui/material";
import { PASSWORD_RULES, type PasswordRule } from "../../../lib/validation";
import { OkIcon } from "../../feedback/feedbackIcons";
import { formCopy } from "../formCopy";

/** Presentation of password creation hints; API remains the validation authority. */
export interface PasswordStrengthChecklistProps {
  /** Current password, used in memory only and never printed. */ password: string;
  /** Visible labels for the five API rules supplied by the form. */ labels: Record<PasswordRule, string>;
  /** Visible/accessible list title. */ label?: string;
}
/**
 * Live five-rule checklist reading `PASSWORD_RULES` (the same source as the form schema).
 * The polite live region is not atomic: only the item whose state changed is announced, never each key.
 * Use when choosing a new password, not when checking an existing login password.
 * @example <PasswordStrengthChecklist password={password} labels={labels} />
 */
export function PasswordStrengthChecklist({
  password,
  labels,
  label = formCopy.passwordRequirements,
}: PasswordStrengthChecklistProps) {
  return (
    <Box
      component="ul"
      aria-label={label}
      aria-live="polite"
      aria-atomic="false"
      sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 0.75 }}
    >
      {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => {
        const met = PASSWORD_RULES[rule](password);
        return (
          <Box component="li" key={rule} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Desenhos de marca, não emoji: visto grama quando cumpre, círculo vazio quando falta. */}
            {met ? (
              <Box component="span" aria-hidden="true" sx={{ display: "inline-flex", color: "success.dark" }}>
                <OkIcon width={20} height={20} />
              </Box>
            ) : (
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 18,
                  height: 18,
                  mx: "1px",
                  flexShrink: 0,
                  border: 2,
                  borderColor: "text.primary",
                  borderRadius: "50%",
                }}
              />
            )}
            <span>
              {met ? formCopy.met : formCopy.missing} {labels[rule]}
            </span>
          </Box>
        );
      })}
    </Box>
  );
}
