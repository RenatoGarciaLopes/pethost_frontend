import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it.each([
    ["Camila Souza", "CS"],
    ["  Ana Maria Lima  ", "AL"],
    ["Ana Souza (teste)", "AS"],
    ["Ana (apelido (interno)) Souza", "AS"],
    ["Ana Souza (teste sem fechar", "AS"],
    ["Ângela", "Â"],
    ["A\u0302ngela", "Â"],
    ["édson de oliveira", "ÉO"],
    ["Ana da de dos", "A"],
    ["de Souza", "S"],
    ["123 👩 Ana -- Souza! 456 🐾", "AS"],
    ["123Ana 456Souza", "AS"],
    ["João-Silva", "J"],
    ["李 小龍", "李小"],
    ["ACME Pet LTDA (filial 2)", "AL"],
    ["ONG Patas Amigas", "OA"],
    ["ACME", "A"],
    ["Patas S.A.", "PS"],
    ["A.C.M.E.", "A"],
    ["O\u2019Neill", "O"],
    ["", "?"],
    ["   ", "?"],
    ["123 🐾 !!! (teste)", "?"],
    ["da de dos", "?"],
  ])("076 %j vira %s", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
