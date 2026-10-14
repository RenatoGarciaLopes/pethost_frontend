import { describe, expect, it } from "vitest";
import { createPetWizardStore, PET_WIZARD_STEPS } from "./petWizardStore";

describe("store do assistente de pet", () => {
  it("REQ-PNEW-001 começa no passo 1 com o bicho vindo da URL e 3 vagas livres", () => {
    const store = createPetWizardStore({ initialSpecies: "cat" });
    expect(store.getState()).toMatchObject({
      step: 1,
      values: { species: "cat" },
      photos: [null, null, null],
      navigated: false,
    });
    expect(PET_WIZARD_STEPS).toHaveLength(7);
  });

  it("REQ-PNEW-014 aceitar um passo guarda os valores e avança; voltar não perde nada", () => {
    const store = createPetWizardStore();
    store.getState().acceptStep({ species: "dog" });
    store.getState().acceptStep({ name: "Thor", sex: "male" });
    expect(store.getState().step).toBe(3);
    store.getState().back();
    expect(store.getState()).toMatchObject({
      step: 2,
      values: { species: "dog", name: "Thor", sex: "male" },
      navigated: true,
    });
  });

  it("REQ-PNEW-005 trocar o bicho poda só o que deixou de existir e diz o que saiu", () => {
    const store = createPetWizardStore();
    store.getState().acceptStep({ species: "dog" });
    store.getState().acceptStep({ name: "Thor", sex: "male" });
    store.getState().acceptStep({ size: "large", breed: "Vira-lata" });
    store.getState().goTo(1);
    store.getState().acceptStep({ species: "rabbit" });
    expect(store.getState().values).toEqual({ species: "rabbit", name: "Thor", sex: "male", breed: "Vira-lata" });
    expect(store.getState().removedBySpecies).toEqual(["size"]);
    store.getState().acceptStep({ name: "Thor", sex: "male" });
    expect(store.getState().removedBySpecies).toEqual([]);
  });

  it("REQ-PNEW-015 'Editar' na revisão volta ao passo e, ao aceitar, retorna à revisão", () => {
    const store = createPetWizardStore();
    store.getState().restore({ step: 7, values: { species: "dog", name: "Thor" } });
    store.getState().goTo(2, { fromReview: true });
    store.getState().acceptStep({ name: "Thor II", sex: "male" });
    expect(store.getState()).toMatchObject({ step: 7, values: { name: "Thor II" } });
  });

  it("REQ-PNEW-007 fotos por vaga com erro próprio; trocar a foto limpa o erro da vaga", () => {
    const store = createPetWizardStore();
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    store.getState().setPhoto(1, file);
    store.getState().setPhotoError(1, "Essa foto já está na ficha.");
    expect(store.getState().photoErrors).toEqual([null, "Essa foto já está na ficha.", null]);
    store.getState().setPhoto(1, null);
    expect(store.getState()).toMatchObject({ photos: [null, null, null], photoErrors: [null, null, null] });
  });

  it("REQ-PNEW-016 o pet criado fica guardado: nova tentativa só reenvia fotos", () => {
    const store = createPetWizardStore();
    store.getState().markCreated("0199d2a0-0000-7000-8000-000000000001");
    expect(store.getState().petId).toBe("0199d2a0-0000-7000-8000-000000000001");
  });
});

describe("erros da API e recomeço", () => {
  it("REQ-PNEW-017 erro de campo leva ao passo dele; o passo toma só os seus erros, uma vez", () => {
    const store = createPetWizardStore();
    store.getState().restore({ step: 7, values: { species: "dog", name: "Thor" } });
    store
      .getState()
      .showServerErrors(4, { microchip: "Esse microchip já está em outra ficha.", notes: "Longo demais." });
    expect(store.getState()).toMatchObject({ step: 4, returnToReview: true });
    expect(store.getState().takeServerErrors(["microchip", "vetContact"])).toEqual({
      microchip: "Esse microchip já está em outra ficha.",
    });
    expect(store.getState().takeServerErrors(["microchip"])).toEqual({});
    expect(store.getState().serverErrors).toEqual({ notes: "Longo demais." });
  });

  it("REQ-PNEW-021 'Começar de novo' volta ao passo 1 só com o bicho da URL", () => {
    const store = createPetWizardStore({ initialSpecies: "dog" });
    store.getState().restore({ step: 5, values: { species: "cat", name: "Mia" } });
    store.getState().setPhoto(0, new File(["x"], "a.jpg", { type: "image/jpeg" }));
    store.getState().reset();
    expect(store.getState()).toMatchObject({ step: 1, values: { species: "dog" }, photos: [null, null, null] });
  });
});
