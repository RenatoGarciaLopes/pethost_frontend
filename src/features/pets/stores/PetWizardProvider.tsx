"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { PetSpecies } from "../types";
import { createPetWizardStore, type PetWizardState, type PetWizardStore } from "./petWizardStore";

const PetWizardContext = createContext<PetWizardStore | null>(null);

/**
 * Um store do assistente por instância (spec 021): duas abas ou dois testes não dividem estado.
 * @example <PetWizardProvider initialSpecies="dog"><PetWizard … /></PetWizardProvider>
 */
export function PetWizardProvider({ initialSpecies, children }: { initialSpecies?: PetSpecies; children: ReactNode }) {
  const [store] = useState(() => createPetWizardStore({ initialSpecies }));
  return <PetWizardContext value={store}>{children}</PetWizardContext>;
}

function useWizardStore(): PetWizardStore {
  const store = use(PetWizardContext);
  if (!store) throw new Error("usePetWizard precisa do PetWizardProvider");
  return store;
}

/**
 * Lê um pedaço do store; só re-renderiza quando esse pedaço muda.
 * @example const step = usePetWizard((state) => state.step);
 */
export function usePetWizard<T>(selector: (state: PetWizardState) => T): T {
  return useStore(useWizardStore(), selector);
}

/**
 * O store em si, para ler o estado atual dentro de um evento sem assinar mudanças.
 * @example const store = usePetWizardStore(); store.getState().acceptStep(values);
 */
export function usePetWizardStore(): PetWizardStore {
  return useWizardStore();
}
