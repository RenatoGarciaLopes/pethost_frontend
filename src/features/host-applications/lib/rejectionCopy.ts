import type { RejectionReason } from "../types";

/**
 * Motivo da recusa → frase de vizinho, com o que fazer (tabela de `produto/contrato-api.md`). Recusa nunca é
 * culpa: é foto ruim ou dado que não bateu. Exportado para o admin (031) ver o que a pessoa leu.
 */
export const rejectionCopy: Readonly<Record<RejectionReason, string>> = {
  document_illegible: "Não deu pra ler o documento. Tira a foto de dia, perto da janela, sem reflexo.",
  document_expired: "O documento está vencido. Manda outro que esteja na validade.",
  selfie_mismatch: "Na selfie precisa aparecer o seu rosto e o documento na mão.",
  data_mismatch: "Os dados do documento não batem com os da conta. Confere nome e nascimento.",
  missing_document: "Uma das fotos não era a que a gente pediu.",
  other: "Não conseguimos confirmar sua identidade dessa vez.",
};

/**
 * A frase da recusa; sem motivo, a de `other`.
 * @example describeRejection(application.rejectionReason)
 */
export function describeRejection(reason: RejectionReason | null): string {
  return rejectionCopy[reason ?? "other"];
}
