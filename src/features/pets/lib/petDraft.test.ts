import { expect, it } from "vitest";
import { petDraftKey, petDraftSchema, toPetDraft } from "./petDraft";
it("REQ-PNEW-021 chave separa contas e rascunho elimina microchip e fotos", () => {
  expect(petDraftKey("a")).toBe("pethost:pet-draft:a");
  expect(petDraftKey("b")).not.toBe(petDraftKey("a"));
  const value = { name: "Mel", species: "dog" as const, microchip: "123456789012345", photos: ["privado"] };
  expect(toPetDraft(2, value)).toEqual({ step: 2, values: { name: "Mel", species: "dog" } });
  expect(value.microchip).toBe("123456789012345");
  expect(petDraftSchema.parse({ step: 1, values: { microchip: "privado", photos: ["foto"] } })).toEqual({
    step: 1,
    values: {},
  });
});
it("REQ-PNEW-021 rascunho parcial aceita começo incompleto mas não dados inválidos", () => {
  expect(petDraftSchema.safeParse({ step: 1, values: { species: "dog" } }).success).toBe(true);
  for (const draft of [
    { step: 0, values: {} },
    { step: 8, values: {} },
    { step: 1.5, values: {} },
    { step: 2, values: { name: "a".repeat(61) } },
    { step: 2, values: { species: "dragon" } },
  ])
    expect(petDraftSchema.safeParse(draft).success).toBe(false);
});
