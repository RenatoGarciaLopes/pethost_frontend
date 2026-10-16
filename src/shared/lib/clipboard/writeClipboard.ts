/** Solicita ao navegador copiar um texto após gesto explícito do usuário.
 * @example await writeClipboard(traceId)
 */
export async function writeClipboard(value: string, clipboard: Pick<Clipboard, "writeText"> = navigator.clipboard) {
  await clipboard.writeText(value);
}
