import { expect, it } from "vitest";
import { normalizeMicrochip } from "./normalizeMicrochip";
it.each([
  ["123 456-789012345", "123456789012345"],
  ["123\t456789012345", "123456789012345"],
  ["", null],
  ["12345678901234", null],
  ["1234567890123456", null],
  ["a23456789012345", null],
])("REQ-PNEW-010 normaliza %s", (text, expected) => expect(normalizeMicrochip(text)).toBe(expected));
