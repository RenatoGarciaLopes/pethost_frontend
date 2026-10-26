import { expect, it } from "vitest";
import { firstParam } from "./searchParams";

it.each([
  [undefined, undefined],
  [[], undefined],
  ["host", "host"],
  [["host", "owner"], "host"],
  ["", ""],
])("retorna o primeiro parâmetro preservando ausências e valores vazios: %j", (input, expected) => {
  expect(firstParam(input as string | string[] | undefined)).toBe(expected);
});
