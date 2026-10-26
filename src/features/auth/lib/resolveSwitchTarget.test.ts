import { expect, it } from "vitest";
import { resolveSwitchTarget } from "./resolveSwitchTarget";

it.each(["owner", "host"] as const)("REQ-SWITCH-011 resolve destino diferente da conta %s", (current) => {
  const other = current === "owner" ? "host" : "owner";
  for (const to of [undefined, "", "admin", "desconhecido", current, other])
    expect(resolveSwitchTarget(current, to)).toBe(other);
});
