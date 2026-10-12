"use client";
import { Box } from "@mui/material";
import { formCopy } from "../formCopy";

/** Keys of the five password rules from Auth.Domain.Users.Password (8–128 UTF-16 chars). */
export type PasswordRule = "length" | "uppercase" | "lowercase" | "digit" | "special";
/** Presentation of password creation hints; API remains the validation authority. */
export interface PasswordStrengthChecklistProps {
  /** Current password, used in memory only and never printed. */ password: string;
  /** Visible labels for the five API rules supplied by the form. */ labels: Record<PasswordRule, string>;
  /** Visible/accessible list title. */ label?: string;
}
/**
 * Live five-rule checklist; excludes whitespace from special characters.
 * Use when choosing a new password, not when checking an existing login password.
 * @example <PasswordStrengthChecklist password={password} labels={labels} />
 */
export function PasswordStrengthChecklist({
  password,
  labels,
  label = formCopy.passwordRequirements,
}: PasswordStrengthChecklistProps) {
  const rules: Record<PasswordRule, boolean> = {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /\p{Lu}/u.test(password),
    lowercase: /\p{Ll}/u.test(password),
    digit: /\p{Nd}/u.test(password),
    special: /[^\p{L}\p{Nd}\s]/u.test(password),
  };
  return (
    <Box component="ul" aria-label={label} aria-live="polite" aria-atomic="true" sx={{ pl: 3 }}>
      {(Object.keys(rules) as PasswordRule[]).map((rule) => (
        <li key={rule}>
          <span aria-hidden="true">{rules[rule] ? "✓ " : "○ "}</span>
          {rules[rule] ? formCopy.met : formCopy.missing} {labels[rule]}
        </li>
      ))}
    </Box>
  );
}
