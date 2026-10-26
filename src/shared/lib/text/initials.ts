/**
 * Iniciais Unicode do primeiro e último nome útil. Remove observações entre parênteses
 * (inclusive aninhadas), números, pontuação, emoji e partículas isoladas.
 * Empresa segue a mesma regra: "ACME Pet LTDA" vira "AL"; sigla sozinha usa uma inicial.
 * Sem letras úteis retorna "?". Não altera o nome exibido ou enviado à API.
 * @example initialsOf("Ana Souza (teste)") // "AS"
 */
export function initialsOf(fullName: string): string {
  let depth = 0;
  let name = "";
  for (const character of fullName.normalize("NFC")) {
    if (character === "(") {
      depth += 1;
      name += " ";
    } else if (character === ")") {
      depth = Math.max(0, depth - 1);
      name += " ";
    } else if (depth === 0) {
      name += character;
    }
  }
  const words = name
    .split(/\s+/u)
    .map((word) => word.match(/\p{L}[\p{L}\p{M}]*/gu)?.join("") ?? "")
    .filter((word) => word && !/^(da|de|do|das|dos|e)$/iu.test(word));
  if (!words.length) return "?";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words.at(-1)!)[0] : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}
