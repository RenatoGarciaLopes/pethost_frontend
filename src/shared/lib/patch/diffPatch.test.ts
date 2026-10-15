import { expect, it } from "vitest";
import { diffPatch } from "./diffPatch";

it("REQ-PEDIT-005 compara textos aparados e preserva booleanos e números alterados", () => {
  expect(diffPatch({ name: "Mel", active: true, count: 1 }, { name: " Mel ", active: false, count: 0 })).toEqual({
    active: false,
    count: 0,
  });
});

it("REQ-PEDIT-005 limpa opcionais apagados ou ausentes sem enviar ausentes comuns", () => {
  const original: Record<string, unknown> = { breed: "SRD", notes: "Rotina", name: "Mel", empty: undefined };
  expect(diffPatch(original, { breed: "  " }, { clearable: ["breed", "notes", "empty"] })).toEqual({
    breed: "",
    notes: "",
  });
});

it("REQ-PEDIT-005 não envia limpezas sem valor anterior nem campos undefined", () => {
  expect(diffPatch({ notes: "", name: "Mel" }, { notes: " ", name: undefined }, { clearable: ["notes"] })).toEqual({});
});

it("REQ-PEDIT-005 aceita undefined explícito para limpar e inclui campos novos", () => {
  const original: Record<string, unknown> = { notes: "Texto" };
  expect(diffPatch(original, { notes: undefined, count: 2 }, { clearable: ["notes"] })).toEqual({
    notes: "",
    count: 2,
  });
  expect(diffPatch({ name: "Mel" }, { name: " " })).toEqual({ name: "" });
});

it("REQ-PEDIT-005 usa Object.is e aceita comparador explícito sem mutar entradas", () => {
  expect(diffPatch({ value: NaN }, { value: NaN })).toEqual({});
  const original = Object.freeze({ value: { count: 1 } });
  const edited = Object.freeze({ value: { count: 1 } });
  expect(diffPatch(original, edited)).toEqual(edited);
  expect(diffPatch(original, edited, { equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) })).toEqual({});
});
