import { describe, expect, it } from "vitest";
import type { HostListingProfile, Listing, MyListings } from "../types";
import { newListingGate } from "./newListingGate";

const profile = (overrides: Partial<HostListingProfile> = {}): HostListingProfile => ({
  kind: "person",
  firstName: "Cida",
  address: null,
  payoutsEnabled: true,
  stripeStatus: "enabled",
  ...overrides,
});
const mine = (count: number): MyListings => ({
  isCompany: false,
  payoutsEnabled: true,
  listings: Array.from({ length: count }, (_, index) => ({ id: `cantinho-${index}` }) as Listing),
});

describe("newListingGate", () => {
  it("REQ-LIST-002 sem recebimento liberado, mostra o aviso com o caminho do recebimento", () => {
    expect(newListingGate(profile({ payoutsEnabled: false }), mine(0))).toEqual({ kind: "noPayouts" });
  });

  it("REQ-LIST-002 pessoa física que já tem cantinho vai para ele", () => {
    expect(newListingGate(profile(), mine(1))).toEqual({ kind: "redirect", to: "/host/listings/cantinho-0" });
  });

  it("REQ-LIST-002 empresa abre mais um cantinho (um por filial)", () => {
    expect(newListingGate(profile({ kind: "company" }), mine(2))).toEqual({ kind: "open" });
  });

  it("REQ-LIST-002 ainda não verificado volta para o painel", () => {
    expect(newListingGate(null, mine(0))).toEqual({ kind: "redirect", to: "/host" });
  });
});
