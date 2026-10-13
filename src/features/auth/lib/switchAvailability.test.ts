import { expect, it } from "vitest";
import type { LinkedAccount } from "../types/linkedAccount";
import { switchAvailability } from "./switchAvailability";

it.each(["owner", "host"] as const)("REQ-SWITCH-003 diferencia conta %s ausente, pausada e ativa", (target) => {
  const other = target === "owner" ? "host" : "owner";
  const current: LinkedAccount = { role: other, isActive: true, isCurrent: true };
  expect(switchAvailability([], target)).toBe("missing");
  expect(switchAvailability([current], target)).toBe("missing");
  expect(switchAvailability([current, { role: target, isActive: false, isCurrent: false }], target)).toBe("paused");
  expect(switchAvailability([current, { role: target, isActive: true, isCurrent: false }], target)).toBe("available");
});
