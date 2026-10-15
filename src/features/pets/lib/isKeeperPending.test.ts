import { expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { isKeeperPending } from "./isKeeperPending";
it("REQ-HPETS-002 reconhece só o código tipado de perfil ausente", () => {
  expect(isKeeperPending(new ApiError({ status: 404, code: "PET_KEEPER_NOT_FOUND", message: "raw" }))).toBe(true);
  expect(isKeeperPending(new ApiError({ status: 404, code: "PET_NOT_FOUND", message: "raw" }))).toBe(false);
  expect(isKeeperPending(new Error("PET_KEEPER_NOT_FOUND"))).toBe(false);
});
