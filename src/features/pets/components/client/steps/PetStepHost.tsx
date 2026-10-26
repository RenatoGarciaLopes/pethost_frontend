"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { PetWizardValues } from "../../../stores/petWizardStore";
import { usePetWizard, usePetWizardStore } from "../../../stores/PetWizardProvider";
import type { Ref } from "react";

/** Quando o passo é uma seção da edição (spec 022): título curto, "Salvar {seção}" e o aviso da seção. */
export interface PetSectionChrome {
  title: string;
  /** `id` da `section`, para o aviso de outra seção levar até ela (REQ-PEDIT-015). */
  anchorId: string;
  busy: boolean;
  /** `Notice` da seção ("Salvo.", "Nada mudou por aqui.", erro), abaixo do botão. */
  status?: ReactNode;
  /** A seção acabou de remontar depois de salvar: o foco volta ao "Salvar" (o botão antigo saiu da página). */
  focusSaveOnMount: boolean;
  /** O formulário da seção tem alteração não salva (REQ-PEDIT-017). */
  onDirtyChange: (dirty: boolean) => void;
  /** Formulário atual, para "Salvar e ir" usar a validação normal do passo. */
  formRef?: Ref<HTMLFormElement>;
  actions?: ReactNode;
  onPreview?: (values: PetWizardValues) => void;
}

/**
 * O que um passo da ficha precisa de quem o hospeda: os valores salvos, o que fazer ao aceitar e os erros de
 * campo da API. O assistente da 021 hospeda um passo por vez; a edição da 022 hospeda cada passo como seção.
 */
export interface PetStepHostValue {
  mode: "wizard" | "section";
  values: PetWizardValues;
  accept: (values: PetWizardValues) => void;
  /** Erros de campo da API deste passo, tomados uma vez ao montar. */
  takeServerErrors: (fields: readonly string[]) => Partial<Record<string, string>>;
  section?: PetSectionChrome;
}

const PetStepHostContext = createContext<PetStepHostValue | null>(null);

/**
 * Hospeda um passo como seção da edição (spec 022).
 * @example <PetStepHostProvider value={{ mode: "section", values, accept, takeServerErrors, section }}><HealthStep /></PetStepHostProvider>
 */
export function PetStepHostProvider({ value, children }: { value: PetStepHostValue; children: ReactNode }) {
  return <PetStepHostContext value={value}>{children}</PetStepHostContext>;
}

/**
 * Hospeda o passo atual do assistente (spec 021) com o store dele.
 * @example <WizardStepHost><SpeciesStep /></WizardStepHost>
 */
export function WizardStepHost({ children }: { children: ReactNode }) {
  const store = usePetWizardStore();
  const values = usePetWizard((state) => state.values);
  const acceptStep = usePetWizard((state) => state.acceptStep);
  const value = useMemo<PetStepHostValue>(
    () => ({ mode: "wizard", values, accept: acceptStep, takeServerErrors: store.getState().takeServerErrors }),
    [values, acceptStep, store],
  );
  return <PetStepHostContext value={value}>{children}</PetStepHostContext>;
}

/**
 * O anfitrião do passo: assistente ou seção.
 * @example const { values, accept } = usePetStep();
 */
export function usePetStep(): PetStepHostValue {
  const host = use(PetStepHostContext);
  if (!host) throw new Error("usePetStep precisa do WizardStepHost ou do PetStepHostProvider");
  return host;
}
