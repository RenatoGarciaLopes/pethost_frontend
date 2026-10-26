"use client";

import { useMemo } from "react";
import { RequestStayForm, type PickablePet, type RequestStayFormProps } from "@/features/bookings/index.client";
import {
  listingClosedDays,
  petFitsListing,
  stayTotal,
  type ListingClosedPeriod,
  type ListingFitRules,
} from "@/features/listing-page";

export interface RequestStayComposerProps extends Omit<RequestStayFormProps, "pets" | "totalOf" | "closedDay"> {
  /** Regras de espécie e porte do cantinho. */
  rules: ListingFitRules;
  pets: readonly Omit<PickablePet, "fit">[];
  /** Dias da semana em que o cantinho recebe e os períodos fechados pelo anfitrião: viram os dias riscados. */
  availableWeekdays: readonly string[];
  closedPeriods: readonly ListingClosedPeriod[];
}

/**
 * Junta a 042 ao pedido (spec 050): "combina" pelo `petFitsListing`, o total pelo `stayTotal` e os dias fechados do
 * calendário pelo `listingClosedDays` da página do cantinho, sem a feature de reservas importar a do cantinho. Fica na rota porque funções não passam do servidor ao cliente.
 *
 * @example <RequestStayComposer accountId={user.id} listing={listing} rules={rules} pets={pets} today={today} initial={initial} />
 */
export function RequestStayComposer({
  rules,
  pets,
  listing,
  availableWeekdays,
  closedPeriods,
  ...props
}: RequestStayComposerProps) {
  const pickable = useMemo(() => pets.map((pet) => ({ ...pet, fit: petFitsListing(pet, rules) })), [pets, rules]);
  const closedDay = useMemo(
    () => listingClosedDays(availableWeekdays, closedPeriods),
    [availableWeekdays, closedPeriods],
  );
  return (
    <RequestStayForm
      {...props}
      listing={listing}
      pets={pickable}
      closedDay={closedDay}
      totalOf={(checkIn, checkOut, count) => stayTotal(listing.nightlyRate, checkIn, checkOut, count)}
    />
  );
}
