import { createStore } from "zustand/vanilla";
import type { PetProfileValues } from "../schemas/petProfileSchema";
import { pruneForSpecies } from "../lib/species";
import type { PetSpecies } from "../types";

/** Os 7 passos do cadastro, na ordem (REQ-PNEW-001). */
export const PET_WIZARD_STEPS = ["species", "identity", "body", "health", "routine", "social", "review"] as const;
const REVIEW_STEP = PET_WIZARD_STEPS.length;
const PHOTO_SLOTS = 3;

export type PetWizardValues = Partial<PetProfileValues>;
type SpeciesField = "size" | "speciesDescription";

export interface PetWizardState {
  /** 1 a 7. */
  step: number;
  /** Respostas aceitas até aqui; cada passo edita a sua parte com o próprio formulário. */
  values: PetWizardValues;
  /** Uma posição por vaga; a primeira é a capa. Só em memória, nunca no rascunho. */
  photos: (File | null)[];
  photoErrors: (string | null)[];
  /** Campos que sumiram na última troca de bicho, para a dica do REQ-PNEW-005. */
  removedBySpecies: SpeciesField[];
  /** "Editar" na revisão: ao aceitar o passo, volta para a revisão. */
  returnToReview: boolean;
  /** Pet já criado: uma nova tentativa só reenvia fotos (REQ-PNEW-016). */
  petId: string | null;
  /** Já trocou de passo nesta visita: o título do passo novo recebe o foco. */
  navigated: boolean;
  /** Erros de campo vindos da API (REQ-PNEW-017); o passo do campo aplica ao montar e limpa. */
  serverErrors: Partial<Record<string, string>>;
  acceptStep: (values: PetWizardValues) => void;
  back: () => void;
  goTo: (step: number, options?: { fromReview?: boolean }) => void;
  setPhoto: (index: number, file: File | null) => void;
  setPhotoError: (index: number, message: string | null) => void;
  markCreated: (petId: string) => void;
  restore: (draft: { step: number; values: PetWizardValues }) => void;
  /** Erros de campo da API e o passo do primeiro deles. */
  showServerErrors: (step: number, errors: Partial<Record<string, string>>) => void;
  takeServerErrors: (fields: readonly string[]) => Partial<Record<string, string>>;
  /** "Começar de novo": volta ao passo 1, só com o bicho da URL. */
  reset: () => void;
}

const replaceAt = <T>(list: readonly T[], index: number, value: T) =>
  list.map((item, slot) => (slot === index ? value : item));

/**
 * Store do assistente "Apresentar o pet" (spec 021), um por instância (`PetWizardProvider`). Guarda passo,
 * respostas aceitas e fotos; cada passo valida a sua parte antes de chamar `acceptStep`.
 *
 * @example const store = createPetWizardStore({ initialSpecies: "dog" }); store.getState().acceptStep({ name: "Thor", sex: "male" });
 */
export function createPetWizardStore({ initialSpecies }: { initialSpecies?: PetSpecies } = {}) {
  const initial = () => ({
    step: 1,
    values: initialSpecies ? { species: initialSpecies } : {},
    photos: Array<File | null>(PHOTO_SLOTS).fill(null),
    photoErrors: Array<string | null>(PHOTO_SLOTS).fill(null),
    removedBySpecies: [] as SpeciesField[],
    returnToReview: false,
    petId: null,
    navigated: false,
    serverErrors: {},
  });
  return createStore<PetWizardState>()((set, get) => ({
    ...initial(),

    acceptStep(stepValues) {
      const { values, step, returnToReview } = get();
      let next = { ...values, ...stepValues };
      let removed: SpeciesField[] = [];
      if (next.species && stepValues.species && stepValues.species !== values.species) {
        const pruned = pruneForSpecies({ ...next, species: next.species });
        removed = (["size", "speciesDescription"] as const).filter((field) => field in next && !(field in pruned));
        next = pruned;
      }
      set({
        values: next,
        removedBySpecies: removed,
        step: returnToReview ? REVIEW_STEP : Math.min(step + 1, REVIEW_STEP),
        returnToReview: false,
        navigated: true,
      });
    },
    back() {
      set(({ step }) => ({ step: Math.max(step - 1, 1), returnToReview: false, navigated: true }));
    },
    goTo(step, { fromReview = false } = {}) {
      set({ step, returnToReview: fromReview, navigated: true });
    },
    setPhoto(index, file) {
      set(({ photos, photoErrors }) => ({
        photos: replaceAt(photos, index, file),
        photoErrors: replaceAt(photoErrors, index, null),
      }));
    },
    setPhotoError(index, message) {
      set(({ photoErrors }) => ({ photoErrors: replaceAt(photoErrors, index, message) }));
    },
    markCreated(petId) {
      set({ petId });
    },
    restore({ step, values }) {
      set({ step, values });
    },
    showServerErrors(step, errors) {
      set({ step, serverErrors: errors, returnToReview: true, navigated: true });
    },
    takeServerErrors(fields) {
      const { serverErrors } = get();
      const taken = Object.fromEntries(
        fields.filter((field) => serverErrors[field]).map((field) => [field, serverErrors[field]]),
      );
      if (Object.keys(taken).length) {
        const rest = { ...serverErrors };
        for (const field of Object.keys(taken)) delete rest[field];
        set({ serverErrors: rest });
      }
      return taken;
    },
    reset() {
      set({ ...initial(), navigated: true });
    },
  }));
}

export type PetWizardStore = ReturnType<typeof createPetWizardStore>;
