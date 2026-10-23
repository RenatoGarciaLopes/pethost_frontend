"use client";
import { useState, type Ref } from "react";
import { Calendar } from "../Calendar/Calendar";
import { calendarCopy } from "../Calendar/calendarCopy";
import { CalendarInput } from "../Calendar/CalendarInput";
import { formatDisplayDate } from "../Calendar/calendarDates";
import { CalendarPopover } from "../Calendar/CalendarPopover";

export interface DateFieldProps {
  label: string;
  /** Data ISO `yyyy-MM-dd` ou vazio. */
  value: string;
  onChange: (value: string) => void;
  /** Chamado quando o calendário fecha (o "sair do campo" da validação). */
  onBlur?: () => void;
  min?: string;
  max?: string;
  /** Hoje, `yyyy-MM-dd`, do servidor; sem ele, hoje em Brasília. */
  today?: string;
  /** Permite apagar a data pelo "Limpar" do calendário (filtros opcionais). */
  clearable?: boolean;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Uma data com o calendário do PetHost (popover no desktop, folha de baixo no celular). Para estadias use
 * `DateRangeField`; para nascimento antigo digitado, `BirthDateField`.
 *
 * @example <DateField label="De" value={from} onChange={setFrom} clearable />
 */
export function DateField({ onChange, onBlur, clearable = false, min, max, today, ...input }: DateFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  function close() {
    setAnchor(null);
    onBlur?.();
  }
  return (
    <>
      <CalendarInput {...input} value={formatDisplayDate(input.value)} onOpen={setAnchor} />
      <CalendarPopover open={Boolean(anchor)} anchorEl={anchor} onClose={close} label={calendarCopy.dateDialog}>
        {() => (
          <Calendar
            mode="single"
            autoFocus
            value={input.value}
            min={min}
            max={max}
            today={today}
            onChange={(value) => {
              onChange(value);
              close();
            }}
            onClear={
              clearable
                ? () => {
                    onChange("");
                    close();
                  }
                : undefined
            }
          />
        )}
      </CalendarPopover>
    </>
  );
}
