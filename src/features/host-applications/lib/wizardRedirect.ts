import type { MyApplication, WizardEntry } from "../types";
import { APPLICATION_DOCUMENTS_PATH, APPLICATION_PATH } from "./applicationPaths";

/**
 * Para onde o assistente manda, pelo estado do servidor (REQ-HVER-002/011/015): com rascunho aberto, `/new` leva ao
 * passo que falta; sem poder começar (em análise, aprovada, bloqueada, sem tentativas), volta ao status;
 * `/documents` só existe com rascunho. `null` = fica.
 *
 * @example const target = wizardRedirect("start", mine); if (target) redirect(target);
 */
export function wizardRedirect(entry: WizardEntry, mine: MyApplication): string | null {
  const status = mine.application?.status;
  if (entry === "documents") return status === "draft" ? null : APPLICATION_PATH;
  if (status === "draft") return APPLICATION_DOCUMENTS_PATH;
  const open = status === "submitted" || status === "approved";
  return mine.canStartNew && !open ? null : APPLICATION_PATH;
}
