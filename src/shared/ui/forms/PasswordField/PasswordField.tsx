"use client";
import { useRef, useState } from "react";
import { Button, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import { useForkRef } from "@mui/material/utils";
import { formCopy } from "../formCopy";

/** MUI text-field props, with a required visible label and managed password type. */
export type PasswordFieldProps = Omit<TextFieldProps, "type" | "label"> & {
  /** Visible field label, provided by the consuming form. */
  label: string;
  /** Accessible toggle text when concealed. */
  showLabel?: string;
  /** Accessible toggle text when revealed. */
  hideLabel?: string;
};
/**
 * Password input with an accessible visibility toggle; keeps focus in the field.
 * Use for password entry, not for enforcing strength or storing credentials.
 * @example <PasswordField label="Senha" autoComplete="current-password" />
 */
export function PasswordField({
  label,
  showLabel = formCopy.showPassword,
  hideLabel = formCopy.hidePassword,
  inputRef,
  disabled,
  slotProps,
  ...rest
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const combinedRef = useForkRef(fieldRef, inputRef);
  const inputProps = typeof slotProps?.input === "function" ? slotProps.input : slotProps?.input;
  return (
    <TextField
      {...rest}
      label={label}
      disabled={disabled}
      inputRef={combinedRef}
      type={isVisible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: (state) => ({
          ...(typeof inputProps === "function" ? inputProps(state) : inputProps),
          endAdornment: (
            <InputAdornment position="end">
              <Button
                variant="quiet"
                disabled={disabled}
                aria-pressed={isVisible}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setIsVisible((current) => !current);
                  fieldRef.current?.focus();
                }}
                sx={{ px: 1, minWidth: 48 }}
              >
                {isVisible ? hideLabel : showLabel}
              </Button>
            </InputAdornment>
          ),
        }),
      }}
    />
  );
}
