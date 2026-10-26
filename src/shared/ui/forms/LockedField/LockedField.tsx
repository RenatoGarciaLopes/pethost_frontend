"use client";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

/** Read-only field props retaining MUI's presentation API. */
export type LockedFieldProps = Omit<TextFieldProps, "label" | "value" | "onChange"> & {
  /** Visible field label. */ label: string;
  /** Public, non-secret value (read-only is not a security boundary). */ value: string;
  /** Visible explanation associated with the field. */ reason: string;
};
/**
 * Readable locked text field with decorative lock and a visible reason.
 * Preserves caller adornments while enforcing read-only, including callback slots.
 * Use for immutable public data; never render secrets or rely on read-only for authorization.
 * @example <LockedField label="Documento" value={value} reason="Já confirmado" />
 */
export function LockedField({ label, value, reason, slotProps, ...rest }: LockedFieldProps) {
  const inputProps = slotProps?.input;
  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      helperText={reason}
      slotProps={{
        ...slotProps,
        input: (state) => {
          const resolved = typeof inputProps === "function" ? inputProps(state) : inputProps;
          return {
            ...resolved,
            readOnly: true,
            endAdornment: (
              <>
                {resolved?.endAdornment}
                <InputAdornment position="end">
                  <span aria-hidden="true">🔒</span>
                </InputAdornment>
              </>
            ),
          };
        },
      }}
    />
  );
}
