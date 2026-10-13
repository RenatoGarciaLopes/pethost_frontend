import { expect, it } from "vitest";
import { roleLabel } from "./roleLabels";

it("REQ-SWITCH-002 nomes dos papéis são explícitos e neutros", () => {
  expect(roleLabel("owner")).toBe("tutor");
  expect(roleLabel("host")).toBe("anfitrião");
  expect(roleLabel("admin")).toBe("admin");
});
