import { formatCount } from "../formatErrorParams";
import type { CopyCatalog } from "../copyTypes";

/** Validações genéricas, reaproveitadas por vários campos (contrato 090). */
export const validationErrorCopy = {
  FIELD_REQUIRED: "Esse campo é obrigatório.",
  FIELD_TOO_LONG: ({ params }) =>
    typeof params.max === "number"
      ? `Cabe até ${formatCount(params.max)} caracteres.`
      : "Esse texto está longo demais.",
  FIELD_INVALID_FORMAT: "Esse formato não é válido. Confere o que foi digitado.",
} satisfies CopyCatalog;
