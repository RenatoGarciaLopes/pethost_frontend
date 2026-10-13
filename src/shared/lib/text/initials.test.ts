import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it.each([
    ["Camila Souza", "CS"],
    ["  Ana Maria Lima  ", "AL"],
    ["Ágata", "Á"],
    ["édson de oliveira", "ÉO"],
    ["", "?"],
    ["   ", "?"],
  ])("REQ-ACC-002 REQ-ACC-014 %j vira %s", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
