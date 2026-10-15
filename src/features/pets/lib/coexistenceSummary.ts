import type { HouseResident } from "../types";
import { petsCopy } from "./petsCopy";
/** Resume apenas convivências positivas, sem inventar compatibilidade quando todas são falsas. @example coexistenceSummary(resident) */
export function coexistenceSummary(
  resident: Pick<HouseResident, "goodWithDogs" | "goodWithCats" | "goodWithKids">,
): string {
  const copy = petsCopy.residents;
  const labels = [
    resident.goodWithDogs && copy.dogs,
    resident.goodWithCats && copy.cats,
    resident.goodWithKids && copy.kids,
  ].filter((label) => label !== false);
  if (!labels.length) return "";
  const company = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
  return copy.coexistence(company);
}
