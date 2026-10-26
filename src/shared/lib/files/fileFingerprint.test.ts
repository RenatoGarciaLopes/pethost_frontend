import { expect, it } from "vitest";
import { fileFingerprint } from "./fileFingerprint";
it("REQ-PNEW-007 compara conteúdo sem depender de nome ou tipo do arquivo", async () => {
  const digest = await fileFingerprint(new File(["abc"], "a.jpg", { type: "image/jpeg" }));
  expect(digest).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(await fileFingerprint(new File(["abc"], "b.png"))).toBe(digest);
  expect(await fileFingerprint(new File(["abd"], "a.jpg"))).not.toBe(digest);
});
