import { expect, it } from "vitest";
import { petsCopy } from "./petsCopy";
it("REQ-HPETS-001/004 os dois papéis têm as mesmas chaves e textos próprios", () => {
  expect(Object.keys(petsCopy.owner)).toEqual(Object.keys(petsCopy.host));
  expect(petsCopy.host.title).toBe("Pets da casa");
  expect(petsCopy.host.newPet).toBe("Apresentar um pet da casa");
  expect(petsCopy.host.empty.title).toBe("Tem bicho morando com você? Apresenta pra quem vai se hospedar aí.");
  expect(petsCopy.host.opening).toBe("Quem mora com você?");
  expect(petsCopy.host.another).toBe("Apresentar outro pet da casa");
  expect(petsCopy.owner.title).toBe("Meus pets");
});
