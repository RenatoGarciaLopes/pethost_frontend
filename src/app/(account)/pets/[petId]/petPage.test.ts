import { expect, it, vi } from "vitest";
import { petPageMetadata, requirePetOwner } from "./petPage";

const requirePersonalUser = vi.fn(async () => ({ id: "account-1", role: "owner" }));
const getPetDetail = vi.fn(async () => ({ id: "x", isActive: true, values: { name: "Thor" }, photos: [] }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser: () => requirePersonalUser() }));
vi.mock("@/features/pets/index.server", () => ({
  getPetDetail: (...args: unknown[]) => getPetDetail(...(args as [])),
}));

const PET = "0199d2a0-0000-7000-8000-000000000001";
const pathOf = (petId: string) => `/pets/${petId}`;

it("REQ-PEDIT-002 id que não é UUID vai para o 404 sem ler a sessão nem chamar a API", async () => {
  await expect(requirePetOwner(Promise.resolve({ petId: "thor" }), pathOf)).rejects.toThrow(
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
  expect(requirePersonalUser).not.toHaveBeenCalled();
});

it("REQ-PEDIT-016 exige a conta pessoal dona e devolve o id", async () => {
  await expect(requirePetOwner(Promise.resolve({ petId: PET }), pathOf)).resolves.toEqual({
    user: { id: "account-1", role: "owner" },
    petId: PET,
  });
});

it("REQ-PEDIT-001 título com o nome do pet e fora dos buscadores", async () => {
  const metadata = await petPageMetadata(pathOf)({ params: Promise.resolve({ petId: PET }) });
  expect(metadata).toEqual({ title: "Thor · Meus pets", robots: { index: false, follow: false } });
  expect(getPetDetail).toHaveBeenCalledWith("account-1", PET);
});
