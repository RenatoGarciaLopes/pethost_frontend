"use client";
import { MaskedTextField, type MaskedTextFieldProps } from "../MaskedTextField";
import { formCopy } from "../formCopy";

/** Props do `MaskedTextField`, sem a máscara (sempre data). O valor guardado é `ddmmaaaa` em dígitos. */
export type BirthDateFieldProps = Omit<MaskedTextFieldProps, "mask">;

/**
 * Campo de data de nascimento digitada (`dd/mm/aaaa`), com teclado numérico e `autocomplete="bday"`
 * (REQ-OREG-016). Texto em vez de `type="date"`: o seletor nativo é ruim para datas antigas e varia
 * entre navegadores. A validação (data existe, não é futura, maioridade) é do schema
 * (`parseBrazilianDate`, `isAdult`).
 *
 * @example <BirthDateField label="Quando você nasceu?" value={birth} onValueChange={setBirth} />
 */
export function BirthDateField({ slotProps, ...props }: BirthDateFieldProps) {
  const htmlInput = slotProps?.htmlInput;
  return (
    <MaskedTextField
      autoComplete="bday"
      {...props}
      mask="date"
      slotProps={{
        ...slotProps,
        htmlInput: (state) => ({
          placeholder: formCopy.datePlaceholder,
          ...(typeof htmlInput === "function" ? htmlInput(state) : htmlInput),
        }),
      }}
    />
  );
}
