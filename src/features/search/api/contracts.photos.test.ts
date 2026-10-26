import { expect, it } from "vitest";
import { listingPhotosFixture } from "@/test/fixtures/listingPage";
import { listingPhotosSchema } from "./contracts";

it("retém só fotos públicas para a prévia e valida os campos pelo contrato gerado", () => {
  const parsed = listingPhotosSchema.parse({
    photos: listingPhotosFixture,
    address: { street: "não guardar" },
    host: { id: "account" },
  });
  expect(parsed).toEqual({ photos: listingPhotosFixture });
  expect(listingPhotosSchema.safeParse({ photos: [{ ...listingPhotosFixture[0], position: "first" }] }).success).toBe(
    false,
  );
});
