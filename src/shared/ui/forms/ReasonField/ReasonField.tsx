"use client";
import { TextField } from "@mui/material";
/** Motivo controlado; rótulo, erro e ajuda vêm do domínio. @example const props: ReasonFieldProps = { label: "Motivo", value: "", onChange: () => {} }; */
export interface ReasonFieldProps {
  /** Rótulo visível e acessível. */
  label: string;
  /** Texto controlado em memória pelo consumidor. */
  value: string;
  /** Recebe o texto bruto; normalize no schema antes de enviar. */
  onChange: (value: string) => void;
  /** Mensagem associada ao campo, ativa aria-invalid. */
  error?: string;
  /** Ajuda exibida quando não há erro. */
  helperText?: string;
  /**
   * Bloqueia edição durante uma operação externa. O campo fica só de leitura (não desabilitado): o texto e a
   * ajuda continuam legíveis, com contraste (o MUI clareia demais o campo desabilitado).
   */
  disabled?: boolean;
  /** Limite de digitação, padrão 500; não substitui validação no schema. */
  maxLength?: number;
}
/** Campo de motivo com contador; o consumidor valida o conteúdo aparado.
 * @example <ReasonField label="Motivo" value={reason} onChange={setReason} />
 */
export function ReasonField({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  maxLength = 500,
}: ReasonFieldProps) {
  return (
    <TextField
      fullWidth
      multiline
      minRows={3}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={`${error ?? helperText ?? ""} ${value.length}/${maxLength}`}
      slotProps={{ htmlInput: { maxLength, readOnly: disabled } }}
    />
  );
}
