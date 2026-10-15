/**
 * API pública neutra de pets.
 * Exporte aqui tipos, schemas e funções puras compartilháveis entre ambientes.
 * Não exporte hooks, componentes client ou recursos exclusivos do servidor.
 */
export { petsCopy } from "./lib/petsCopy";
export { petWizardCopy } from "./lib/petWizardCopy";
export { petEditCopy } from "./lib/petEditCopy";
export { isPetId } from "./lib/petId";
export { petSpeciesSchema, myPetsSchema } from "./api/contracts";
// A busca (041) e a página do cantinho (042) compõem os pets sem acoplar duas features.
export { petQueries } from "./api/queries";
export { coexistenceSummary } from "./lib/coexistenceSummary";
export type { HouseResident } from "./types";
