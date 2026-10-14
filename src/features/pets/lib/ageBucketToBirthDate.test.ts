import { expect, it } from "vitest";
import { ageBucketToBirthDate } from "./ageBucketToBirthDate";
it.each([
  ["puppy", "2026-04-01"],
  ["young", "2024-10-01"],
  ["adult", "2021-10-01"],
  ["senior", "2016-10-01"],
] as const)("REQ-PNEW-009 idade %s vira %s sem alterar hoje", (bucket, expected) => {
  const today = new Date(2026, 9, 31);
  const before = today.getTime();
  expect(ageBucketToBirthDate(bucket, today)).toBe(expected);
  expect(today.getTime()).toBe(before);
});
it("REQ-PNEW-009 filhote atravessa o ano sem overflow de fim do mês", () =>
  expect(ageBucketToBirthDate("puppy", new Date(2026, 2, 31))).toBe("2025-09-01"));
