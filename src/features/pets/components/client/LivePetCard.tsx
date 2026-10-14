"use client";

import { useState } from "react";
import { useObjectUrl } from "@/shared/hooks/useObjectUrl";
import { usePetWizard } from "../../stores/PetWizardProvider";
import { PetProfileCard } from "../PetProfileCard";

/**
 * A carteirinha montando ao vivo enquanto a pessoa responde (REQ-PNEW-013): mesma `PetProfileCard` da
 * revisão, só leitura. A tela mostra só no computador; no celular, a carteirinha aparece na revisão.
 *
 * @example <LivePetCard />
 */
export function LivePetCard() {
  const values = usePetWizard((state) => state.values);
  const cover = useObjectUrl(usePetWizard((state) => state.photos[0] ?? null));
  const [now] = useState(() => new Date());
  return <PetProfileCard values={values} coverUrl={cover} now={now} />;
}
