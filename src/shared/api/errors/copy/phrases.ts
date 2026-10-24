import type { ErrorParams } from "../../contracts/envelope";
import type { CopyEntry } from "../copyTypes";
import { formatCount } from "../formatErrorParams";

/** Um parâmetro numérico da regra (`max`, `min`...), já em pt-BR; `undefined` se a API não mandou. */
export function numberParam(params: ErrorParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "number" ? formatCount(value) : undefined;
}

const isPlural = (label: string) => /^(os|as) /.test(label);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Fábricas das frases de validação que se repetem. `label` é o campo com artigo ("o e-mail", "as alergias");
 * o plural sai do artigo. Frase sem número usa o parâmetro quando a API manda e uma versão sem ele quando não.
 */

/** "Falta o e-mail." */
export const required = (label: string): CopyEntry => `${isPlural(label) ? "Faltam" : "Falta"} ${label}.`;

/** "O e-mail aceita até 254 caracteres." (`max`) */
export const tooLong =
  (label: string): CopyEntry =>
  ({ params }) => {
    const verb = isPlural(label) ? "aceitam" : "aceita";
    const max = numberParam(params, "max");
    return max ? `${capitalize(label)} ${verb} até ${max} caracteres.` : `${capitalize(label)} está longo demais.`;
  };

/** "Confere o e-mail: o formato não é válido." */
export const invalid = (label: string): CopyEntry => invalidText(label);

/** "A mensagem tem caracteres que a gente não aceita." */
export const invalidCharacters = (label: string): CopyEntry =>
  `${capitalize(label)} ${isPlural(label) ? "têm" : "tem"} caracteres que a gente não aceita.`;

/** "A chegada não pode ser no passado." */
export const inPast = (label: string): CopyEntry => `${capitalize(label)} não pode ser no passado.`;

/** "A data de nascimento não pode ser no futuro." */
export const inFuture = (label: string): CopyEntry => `${capitalize(label)} não pode ser no futuro.`;

/** "A chegada pode ser até 365 dias à frente." (`max`, em dias) */
export const tooFarAhead =
  (label: string): CopyEntry =>
  ({ params }) => {
    const max = numberParam(params, "max");
    return max
      ? `${capitalize(label)} pode ser até ${max} dias à frente.`
      : `${capitalize(label)} está longe demais no futuro.`;
  };

/** "O tamanho da página precisa ser de 1 a 50." (`max`) */
export const upTo =
  (label: string): CopyEntry =>
  ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `${capitalize(label)} precisa ser um número de 1 a ${max}.` : invalidText(label);
  };

/** "A capacidade precisa ficar entre 1 e 10." (`min`, `max`) */
export const between =
  (label: string, unit = ""): CopyEntry =>
  ({ params }) => {
    const min = numberParam(params, "min");
    const max = numberParam(params, "max");
    const suffix = unit ? ` ${unit}` : "";
    if (min && max) return `${capitalize(label)} precisa ficar entre ${min} e ${max}${suffix}.`;
    if (max) return `${capitalize(label)} pode ser de até ${max}${suffix}.`;
    return invalidText(label);
  };

/** "O CEP precisa ter 8 dígitos." (`digits`) */
export const digits =
  (label: string): CopyEntry =>
  ({ params }) => {
    const count = numberParam(params, "digits");
    return count ? `${capitalize(label)} precisa ter ${count} dígitos.` : invalidText(label);
  };

function invalidText(label: string): string {
  return `Confere ${label}: o formato não é válido.`;
}
