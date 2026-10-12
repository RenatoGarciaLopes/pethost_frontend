/**
 * Converte palavras, separadores e acrônimos em kebab-case ASCII.
 * Não valida nomes de domínio; use assertFeatureName antes de criar arquivos.
 * @param {string} value Texto a converter.
 * @returns {string} Palavras minúsculas separadas por hífen; vazio permanece vazio.
 * @example toKebabCase("PetIdCard") // "pet-id-card"
 */
export function toKebabCase(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Converte palavras em PascalCase, normalizando acrônimos.
 * @param {string} value Texto a converter.
 * @returns {string} Nome convertido; vazio permanece vazio.
 * @example toPascalCase("pet-id-card") // "PetIdCard"
 */
export function toPascalCase(value) {
  return toKebabCase(value)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Valida nome técnico de feature/grupo/widget, sem exigir plural.
 * @param {string} name Nome ASCII em kebab-case, iniciado por letra.
 * @returns {void}
 * @throws {Error} Quando o nome não respeita a convenção.
 * @example assertFeatureName("host-applications");
 */
export function assertFeatureName(name) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name))
    throw new Error("Nome inválido: use kebab-case em minúsculas, começando por uma letra.");
}

/**
 * Valida nome de componente sem transformar silenciosamente a entrada.
 * @param {string} name Nome ASCII em PascalCase.
 * @returns {void}
 * @throws {Error} Quando o nome não respeita PascalCase.
 * @example assertComponentName("PetIdCard");
 */
export function assertComponentName(name) {
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) throw new Error("Nome inválido: use PascalCase para o componente.");
}

/**
 * Valida uma camada relativa a src, sem permitir traversal ou barra final.
 * @param {string} layerPath shared/ui/<grupo> ou features|widgets/<nome>/components/client|server.
 * @returns {void}
 * @throws {Error} Quando a camada ou o nome de domínio é inválido.
 * @example assertLayerPath("features/pets/components/client");
 */
export function assertLayerPath(layerPath) {
  const segment = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
  if (
    !new RegExp(`^(?:shared/ui/${segment}|(?:features|widgets)/${segment}/components/(?:client|server))$`).test(
      layerPath,
    )
  )
    throw new Error("Camada inválida: use shared/ui/<grupo> ou features|widgets/<nome>/components/client|server.");
}

/**
 * Lista a anatomia do componente, com caminhos relativos ao repositório.
 * @param {string} layerPath Camada validada relativa a src.
 * @param {string} name Nome do componente em PascalCase.
 * @returns {string[]} Implementação, teste, story e índice, nesta ordem.
 * @throws {Error} Quando camada ou componente é inválido.
 * @example componentFiles("shared/ui/feedback", "PetIdCard");
 */
export function componentFiles(layerPath, name) {
  assertLayerPath(layerPath);
  assertComponentName(name);
  const base = `src/${layerPath}/${name}`;
  return [`${base}/${name}.tsx`, `${base}/${name}.test.tsx`, `${base}/${name}.stories.tsx`, `${base}/index.ts`];
}

/**
 * Lista apenas as APIs públicas da feature, sem criar pastas planejadas.
 * @param {string} name Nome da feature em kebab-case.
 * @returns {string[]} Índices neutro, client e server, nesta ordem.
 * @throws {Error} Quando o nome é inválido.
 * @example featureFiles("pets");
 */
export function featureFiles(name) {
  assertFeatureName(name);
  return ["index.ts", "index.client.ts", "index.server.ts"].map((file) => `src/features/${name}/${file}`);
}
