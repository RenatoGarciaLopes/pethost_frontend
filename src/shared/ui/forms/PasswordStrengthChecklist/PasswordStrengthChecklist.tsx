"use client";
import { Box } from "@mui/material";
import { PASSWORD_RULES, type PasswordRule } from "../../../lib/validation";
import { OkIcon } from "../../feedback/feedbackIcons";
import { formCopy } from "../formCopy";
import { quintalRadii } from "../../../theme/tokens/radii";
import { visuallyHidden } from "../../a11y/visuallyHidden";

/** Presentation of password creation hints; API remains the validation authority. */
export interface PasswordStrengthChecklistProps {
  /** Current password, used in memory only and never printed. */ password: string;
  /** Visible/accessible list title. */ label?: string;
}
/**
 * Live five-rule pill checklist reading `PASSWORD_RULES` (the same source as the form schema), with the
 * rule labels from `formCopy.passwordRules` (the same in every screen that creates a password).
 * The polite live region is not atomic: only the item whose state changed is announced, never each key.
 * Use when choosing a new password, not when checking an existing login password.
 * @example <PasswordStrengthChecklist password={password} />
 */
export function PasswordStrengthChecklist({
  password,
  label = formCopy.passwordRequirements,
}: PasswordStrengthChecklistProps) {
  return (
    <Box
      component="ul"
      aria-label={label}
      aria-live="polite"
      aria-atomic="false"
      sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexWrap: "wrap", gap: 0.75 }}
    >
      {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => {
        const met = PASSWORD_RULES[rule](password);
        return (
          <Box
            component="li"
            key={rule}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: `${quintalRadii.pill}px`,
              px: 1,
              py: 0.25,
              fontSize: 12,
              fontWeight: 700,
              bgcolor: met ? "success.main" : "transparent",
              color: "text.primary",
            }}
          >
            {met && (
              <Box component="span" aria-hidden="true" sx={{ display: "inline-flex" }}>
                <OkIcon width={14} height={14} />
              </Box>
            )}
            <Box component="span" sx={visuallyHidden}>
              {met ? formCopy.met : formCopy.missing}{" "}
            </Box>
            <span>{formCopy.passwordRules[rule]}</span>
          </Box>
        );
      })}
    </Box>
  );
}
