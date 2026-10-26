import { expect, it, vi } from "vitest";
import { generateMetadata } from "./page";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { sessionUserFixture } from "@/test/fixtures/session";

vi.mock("@/features/pets/index.server", () => ({ MyPetsScreen: () => null }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser: vi.fn() }));

it("REQ-PETS-010 título próprio e fora dos buscadores", async () => {
  vi.mocked(requirePersonalUser).mockResolvedValue({ ...sessionUserFixture, role: "owner" });
  expect(await generateMetadata()).toEqual({ title: "Meus pets · PetHost", robots: { index: false, follow: false } });
});
it("REQ-HPETS-001 título do navegador acompanha conta anfitriã", async () => {
  vi.mocked(requirePersonalUser).mockResolvedValue({ ...sessionUserFixture, role: "host" });
  expect(await generateMetadata()).toEqual({
    title: "Pets da casa · PetHost",
    robots: { index: false, follow: false },
  });
});
