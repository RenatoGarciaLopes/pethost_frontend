/** Identifica conteúdo em memória, sem depender de nome/MIME ou guardar a foto. @example await fileFingerprint(file) */
export async function fileFingerprint(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
