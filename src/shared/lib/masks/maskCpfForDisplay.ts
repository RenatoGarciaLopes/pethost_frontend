import { unmaskCpf } from "./masks";
/** Oculta os seis primeiros dígitos; não valida o documento. @example maskCpfForDisplay("52998224725") // "***.***.247-25" */
export function maskCpfForDisplay(cpf: string | null): string {
  const digits = unmaskCpf(cpf ?? "");
  return digits ? `***.***.${digits.slice(-5, -2)}-${digits.slice(-2)}` : "";
}
