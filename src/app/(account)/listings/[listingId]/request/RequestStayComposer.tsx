"use client";

import { useMemo } from "react";
import { RequestStayForm, type PickablePet, type RequestStayFormProps } from "@/features/bookings/index.client";
import { petFitsListing, stayTotal, type ListingFitRules } from "@/features/listing-page";

export interface RequestStayComposerProps extends Omit<RequestStayFormProps, "pets" | "totalOf"> {
  /** Regras de espécie e porte do cantinho. */
  rules: ListingFitRules;
  pets: readonly Omit<PickablePet, "fit">[];
}

/**
 * Junta a 042 ao pedido (spec 050): "combina" pelo `petFitsListing` e o total pelo `stayTotal` da página do cantinho,
 * sem a feature de reservas importar a do cantinho. Fica na rota porque funções não passam do servidor ao cliente.
 *
 * @example <RequestStayComposer accountId={user.id} listing={listing} rules={rules} pets={pets} today={today} initial={initial} />
 */
export function RequestStayComposer({ rules, pets, listing, ...props }: RequestStayComposerProps) {
  const pickable = useMemo(() => pets.map((pet) => ({ ...pet, fit: petFitsListing(pet, rules) })), [pets, rules]);
  return (
    <RequestStayForm
      {...props}
      listing={listing}
      pets={pickable}
      totalOf={(checkIn, checkOut, count) => stayTotal(listing.nightlyRate, checkIn, checkOut, count)}
    />
  );
}
