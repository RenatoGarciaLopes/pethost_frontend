"use client";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import type { KeyboardEvent, Ref } from "react";
import { calendarCopy } from "./calendarCopy";
import { formatDisplayDate } from "./calendarDates";

export interface CalendarInputProps {
  label: string;
  /** Data ISO `yyyy-MM-dd` ou vazio. */
  value: string;
  open: boolean;
  onOpen: (anchor: HTMLElement) => void;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  error?: boolean;
  helperText?: string;
  onBlur?: TextFieldProps["onBlur"];
  fullWidth?: boolean;
}

function CalendarGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

/**
 * Campo de leitura que mostra a data (dd/mm/aaaa) e abre o calendário por toque, Enter, Espaço ou seta para baixo.
 * Quem usa decide o calendário; este campo só guarda a aparência e o aria do botão de abrir.
 *
 * @example <CalendarInput label="Chegada" value={checkIn} open={open} onOpen={(anchor) => { setAnchor(anchor); setOpen(true); }} />
 */
export function CalendarInput({
  label,
  value,
  open,
  onOpen,
  inputRef,
  name,
  error,
  helperText,
  onBlur,
  fullWidth,
}: CalendarInputProps) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      onOpen(event.currentTarget);
    }
  }
  return (
    <TextField
      label={label}
      name={name}
      value={formatDisplayDate(value)}
      error={error}
      helperText={helperText}
      onBlur={onBlur}
      fullWidth={fullWidth}
      inputRef={inputRef}
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={onKeyDown}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: {
          readOnly: true,
          placeholder: calendarCopy.placeholder,
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          sx: { cursor: "pointer" },
        },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <CalendarGlyph />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
