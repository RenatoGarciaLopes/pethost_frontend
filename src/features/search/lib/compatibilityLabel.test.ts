import { expect, it } from "vitest";
import { compatibilityLabel } from "./compatibilityLabel";

const base = { petName: "Pipoca" };
it("REQ-SRCH-020 sem aviso combina com o pet", () => {
  expect(compatibilityLabel({ ...base, matches: true, warnings: [] })).toEqual({
    tone: "match",
    text: "Combina com a Pipoca",
  });
});
it.each([
  ["home_has_cats", "Tem gato em casa"],
  ["home_has_dogs", "Tem cão em casa"],
  ["home_has_kids", "Tem criança em casa"],
  ["species_not_accepted", "Não recebe esse tipo de pet"],
  ["size_not_accepted", "Não recebe o porte da Pipoca"],
  ["guest_is_dog", "Recebe um cão nessas datas"],
  ["guest_is_cat", "Recebe um gato nessas datas"],
  ["guest_large_dog", "Recebe um cão grande nessas datas"],
  ["guest_dislikes_dogs", "Vai ter cão nessas datas e a Pipoca não curte"],
  ["guest_dislikes_cats", "Vai ter gato nessas datas e a Pipoca não curte"],
  ["algo_novo", "Vale conferir com a Pipoca"],
])("REQ-SRCH-020 aviso %s vira o texto do chip", (code, text) => {
  expect(compatibilityLabel({ ...base, matches: false, warnings: [{ code }] })).toEqual({ tone: "warning", text });
});
it("REQ-SRCH-020 mostra o primeiro aviso e conta os demais", () => {
  const result = compatibilityLabel({
    ...base,
    matches: false,
    warnings: [{ code: "home_has_cats" }, { code: "home_has_kids" }, { code: "guest_is_dog" }],
  });
  expect(result.text).toBe("Tem gato em casa +2");
});
