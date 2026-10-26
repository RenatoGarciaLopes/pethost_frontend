import { describe, expect, it } from "vitest";
import { metadata as authLayoutMetadata } from "../layout";
import { metadata as hostRegisterMetadata } from "./host/page";
import { metadata as ownerRegisterMetadata } from "./owner/page";
import { metadata as registerMetadata } from "./page";

describe("páginas de cadastro", () => {
  it('REQ-OREG-018 título "Criar conta · PetHost" nas duas páginas', () => {
    expect(registerMetadata.title).toBe("Criar conta · PetHost");
    expect(ownerRegisterMetadata.title).toBe("Criar conta · PetHost");
  });

  it('REQ-HREG-010 título "Criar conta de anfitrião · PetHost" no cadastro de anfitrião', () => {
    expect(hostRegisterMetadata.title).toBe("Criar conta de anfitrião · PetHost");
  });

  it("REQ-OREG-018 REQ-HREG-010 fora dos buscadores (layout das telas de conta)", () => {
    expect(authLayoutMetadata.robots).toEqual({ index: false, follow: false });
  });
});
