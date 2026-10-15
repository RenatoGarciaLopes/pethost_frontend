/**
 * API pública neutra de pets.
 * Exporte aqui tipos, schemas e funções puras compartilháveis entre ambientes.
 * Não exporte hooks, componentes client ou recursos exclusivos do servidor.
 */
export { petsCopy } from "./lib/petsCopy";
export { petWizardCopy } from "./lib/petWizardCopy";
export { petEditCopy } from "./lib/petEditCopy";
export { isPetId } from "./lib/petId";
export { petSpeciesSchema } from "./api/contracts";
export { petQueries } from "./api/queries";
export { coexistenceSummary } from "./lib/coexistenceSummary";
export type { HouseResident } from "./types";
