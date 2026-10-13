/** Tipos MIME permitidos e limite em bytes. */
export interface ImageFileRules {
  types: readonly string[];
  maxBytes: number;
}
/** JPEG, PNG e WebP até 5 MiB. @example validateImageFile(file, IMAGE_RULES) */
export const IMAGE_RULES: ImageFileRules = {
  types: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
};
const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
/**
 * Confere metadados antes do envio, sem substituir a inspeção do conteúdo no backend.
 * MIME ausente usa extensão; MIME declarado e extensão de imagem precisam concordar.
 * @example validateImageFile(file) // { ok: true }
 */
export function validateImageFile(
  file: File,
  rules = IMAGE_RULES,
): { ok: true } | { ok: false; reason: "type" | "size" | "empty" } {
  if (file.size === 0) return { ok: false, reason: "empty" };
  const extensionType = extensionTypes[file.name.split(".").pop()?.toLowerCase() ?? ""];
  const mime = file.type || extensionType;
  if (!mime || !rules.types.includes(mime) || (mime.startsWith("image/") && extensionType !== mime))
    return { ok: false, reason: "type" };
  if (file.size > rules.maxBytes) return { ok: false, reason: "size" };
  return { ok: true };
}
