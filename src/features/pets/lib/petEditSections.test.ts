import { expect, it } from "vitest";
import { petDto } from "@/test/fixtures/pets";
import { petDtoSchema } from "../api/contracts";
import { toPetDetail } from "../api/toPetDetail";
import { PET_EDIT_SECTION_IDS, petSectionSummary, sectionIndexOf } from "./petEditSections";

const now = new Date("2026-10-25T12:00:00Z");
const pet = (overrides = {}) => toPetDetail(petDtoSchema.parse(petDto(overrides)));
it("107 resolve cada seção e recusa identificadores desconhecidos", () => {
  PET_EDIT_SECTION_IDS.forEach((id, index) => expect(sectionIndexOf(id)).toBe(index));
  expect(sectionIndexOf(null)).toBe(0);
  expect(sectionIndexOf("inexistente")).toBe(0);
});
it("107 resume fotos, peso com vírgula, idade e respostas salvas", () => {
  expect(petSectionSummary("fotos", pet({ photos: [] }), now)).toBe("Sem foto ainda");
  expect(petSectionSummary("fotos", pet(), now)).toBe("1 foto");
  expect(petSectionSummary("corpo", pet({ weightKg: 4.2, birthDate: "2021-10-25" }), now)).toBe("4,2 kg · 5 anos");
  expect(petSectionSummary("nome", pet({ sex: "female" }), now)).toBe("Thor · fêmea");
  expect(petSectionSummary("rotina", pet({ feedingNotes: "Ração à noite" }), now)).toBe("Ração à noite");
});
it("107 usa gramas para bichos pequenos e resume convivência sem respostas positivas", () => {
  expect(
    petSectionSummary("corpo", pet({ species: "hamster", size: null, weightKg: 0.035, birthDate: null }), now),
  ).toBe("35 g");
  expect(
    petSectionSummary("convivencia", pet({ goodWithDogs: false, goodWithCats: false, goodWithKids: false }), now),
  ).toBe("Nenhum sim marcado");
});
