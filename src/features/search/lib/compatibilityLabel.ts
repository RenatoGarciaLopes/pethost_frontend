import type { ListingCompatibility } from "../api/contracts";
import { searchCopy } from "./searchCopy";

/** Quem avisa: cantinho, casa ou outro hóspede do período. */
type Warning = ListingCompatibility["warnings"][number];

/**
 * Texto curto do chip de compatibilidade, montado a partir do código do aviso (a API não manda texto).
 * Sem aviso, "Combina com a {pet}"; com avisos, o primeiro, e "+N" se houver mais. Código novo da API cai no aviso genérico.
 * @example compatibilityLabel({ matches: false, petName: "Pipoca", warnings: [{ code: "home_has_cats" }] }) // "Tem gato em casa"
 */
export function compatibilityLabel(result: Pick<ListingCompatibility, "matches" | "petName" | "warnings">): {
  tone: "match" | "warning";
  text: string;
} {
  const [first, ...rest] = result.warnings;
  if (result.matches || !first) return { tone: "match", text: searchCopy.compat.matches(result.petName) };
  const text = warningText(first, result.petName);
  return { tone: "warning", text: rest.length ? `${text} +${rest.length}` : text };
}

function warningText(warning: Warning, petName: string): string {
  const copy = searchCopy.compat.warnings;
  const known = copy[warning.code as keyof typeof copy];
  return known ? known(petName) : copy.generic(petName);
}
