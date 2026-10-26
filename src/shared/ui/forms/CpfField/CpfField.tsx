"use client";
import { MaskedTextField, type MaskedTextFieldProps } from "../MaskedTextField";

/** Props do `MaskedTextField`, sem a máscara (sempre CPF). O valor guardado é só dígitos. */
export type CpfFieldProps = Omit<MaskedTextFieldProps, "mask">;

/**
 * Campo de CPF: máscara `000.000.000-00`, teclado numérico e `autocomplete="off"` (o navegador
 * não deve sugerir nem guardar CPF, REQ-OREG-016). Não valida dígitos: isso é do schema (`isValidCpf`).
 * Quando usar: cadastro de tutor (011), perfil (015), verificação (030). A ajuda de "por que pedimos"
 * vem em `helperText` de quem usa.
 *
 * @example <CpfField label="CPF" value={cpf} onValueChange={setCpf} helperText={copy.cpfHelp} />
 */
export function CpfField(props: CpfFieldProps) {
  return <MaskedTextField autoComplete="off" {...props} mask="cpf" />;
}
