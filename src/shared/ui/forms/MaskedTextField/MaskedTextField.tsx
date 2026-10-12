"use client";
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { useForkRef } from "@mui/material/utils";
import {
  maskCpf,
  maskCnpj,
  maskCep,
  maskPhone,
  unmaskCpf,
  unmaskCnpj,
  unmaskCep,
  unmaskPhone,
} from "../../../lib/masks";

/** Supported Brazilian numeric formats; presentation is not document validation. */
export type MaskKind = "cpf" | "cnpj" | "cep" | "phone";
const formats = {
  cpf: [maskCpf, unmaskCpf],
  cnpj: [maskCnpj, unmaskCnpj],
  cep: [maskCep, unmaskCep],
  phone: [maskPhone, unmaskPhone],
} as const;
/** Controlled MUI field; consumers store only digits. */
export type MaskedTextFieldProps = Omit<TextFieldProps, "label" | "value" | "onChange" | "type"> & {
  /** Visible field label. */ label: string;
  /** Format selector. */ mask: MaskKind;
  /** Unmasked, consumer-owned value. */ value: string;
  /** Receives digits on typing, deletion or paste. */ onValueChange: (value: string) => void;
};
/**
 * Numeric format presentation preserving cursor position and deletion across punctuation.
 * Use for Brazilian numeric documents/phones, not international/alphanumeric inputs.
 * @example <MaskedTextField label="CPF" mask="cpf" value={value} onValueChange={setValue} />
 */
export function MaskedTextField({
  label,
  mask,
  value,
  onValueChange,
  slotProps,
  inputRef,
  onKeyDown,
  ...rest
}: MaskedTextFieldProps) {
  const [format, unmask] = formats[mask];
  const fieldRef = useRef<HTMLInputElement>(null);
  const combinedRef = useForkRef(fieldRef, inputRef);
  const caretDigits = useRef<number | null>(null);
  const htmlProps = slotProps?.htmlInput;
  useLayoutEffect(() => {
    const input = fieldRef.current;
    if (!input || caretDigits.current === null) return;
    let position = 0,
      count = 0;
    while (position < input.value.length && count < caretDigits.current) {
      if (/\d/.test(input.value[position])) count++;
      position++;
    }
    input.setSelectionRange(position, position);
    caretDigits.current = null;
  }, [value, mask]);
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !["Backspace", "Delete"].includes(event.key)) return;
    const input = fieldRef.current;
    if (!input || input.readOnly || input.selectionStart !== input.selectionEnd) return;
    const leftDigits = unmask(input.value.slice(0, input.selectionStart ?? 0)).length;
    const removeAt = event.key === "Backspace" ? leftDigits - 1 : leftDigits;
    const raw = unmask(input.value);
    if (removeAt < 0 || removeAt >= raw.length) return;
    event.preventDefault();
    caretDigits.current = removeAt;
    onValueChange(raw.slice(0, removeAt) + raw.slice(removeAt + 1));
  }
  return (
    <TextField
      {...rest}
      label={label}
      inputRef={combinedRef}
      value={format(value)}
      onKeyDown={handleKeyDown}
      onChange={(event) => {
        caretDigits.current = unmask(
          event.target.value.slice(0, event.target.selectionStart ?? event.target.value.length),
        ).length;
        onValueChange(unmask(event.target.value));
      }}
      slotProps={{
        ...slotProps,
        htmlInput: (state) => ({
          ...(typeof htmlProps === "function" ? htmlProps(state) : htmlProps),
          inputMode: "numeric",
        }),
      }}
    />
  );
}
