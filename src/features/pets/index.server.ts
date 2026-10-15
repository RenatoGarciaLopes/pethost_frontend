import "server-only";

/**
 * API pública server de pets.
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { MyPetsScreen } from "./components/MyPetsScreen";
export { PetEditScreen, PetProfileScreen } from "./components/PetProfileScreen";
export { getPetDetail } from "./api/server/petDetail.server";
export { PetWizardScreen } from "./components/PetWizardScreen";
export { prefetchMyPets } from "./api/server/myPets.server";
export { prefetchHouseResidents } from "./api/server/houseResidents.server";
export { KeeperPendingNotice } from "./components/client/KeeperPendingNotice";
