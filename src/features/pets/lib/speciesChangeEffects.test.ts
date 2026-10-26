import { expect, it } from "vitest";
import type { PetSpecies } from "../types";
import { speciesChangeEffects } from "./speciesChangeEffects";

it.each<[PetSpecies, PetSpecies, string[], string[]]>([
  ["dog", "rabbit", ["size"], []],
  ["cat", "dog", [], ["size"]],
  ["dog", "cat", [], []],
  ["rabbit", "exotic", [], ["speciesDescription"]],
  ["dog", "exotic", ["size"], ["speciesDescription"]],
  ["exotic", "cat", ["speciesDescription"], []],
  ["exotic", "dog", ["speciesDescription"], ["size"]],
  ["dog", "dog", [], []],
  ["exotic", "exotic", [], []],
  ["fish", "rabbit", [], []],
])("REQ-PEDIT-007 troca %s para %s informa remoções e exigências", (from, to, removes, requires) => {
  expect(speciesChangeEffects(from, to)).toEqual({ removes, requires });
});
