import type { BookingPet } from "../types";
import { bookingCopy as copy } from "./bookingCopy";

/**
 * Um pet do pedido em uma linha: "Pipoca (cachorro, porte pequeno)"; sem porte, só a espécie; ficha sumida, o aviso.
 * @example booking.pets.map(describeBookingPet).join(" · ")
 */
export function describeBookingPet(pet: BookingPet): string {
  if (!pet.name) return copy.unknownPet;
  const details = [pet.species && copy.species[pet.species], pet.size && copy.sizes[pet.size]].filter(Boolean);
  return details.length > 0 ? `${pet.name} (${details.join(", ")})` : pet.name;
}
