import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import plugin from "../../../scripts/eslint/no-numeric-radius.mjs";

const linter = new Linter({ configType: "flat" });
const config = [{ plugins: { pethost: plugin }, rules: { "pethost/no-numeric-radius": "error" } }];

describe("pethost/no-numeric-radius", () => {
  it("REQ-UIC-001 rejects numeric radii", () => {
    const messages = linter.verify("const sx = { borderRadius: 3 };", config);
    expect(messages.map(({ message }) => message)).toEqual([
      "Use theme.quintal.radius.* or quintalRadii instead of a numeric borderRadius.",
    ]);
  });

  it("REQ-UIC-001 accepts zero, percentage, and named tokens", () => {
    const messages = linter.verify(
      'const sx = { borderRadius: 0, circle: { borderRadius: "50%" }, card: (theme) => theme.quintal.radius.card };',
      config,
    );
    expect(messages).toHaveLength(0);
  });
});
