import { expect, test } from "@playwright/test";

test("REQ-HPETS-001/006 anfitrião aprovado do seed vê pets da casa", async ({ page, baseURL }) => {
  const email = process.env.E2E_HOST_EMAIL;
  const password = process.env.E2E_HOST_PASSWORD;
  test.skip(!email || !password, "Requer E2E_HOST_EMAIL e E2E_HOST_PASSWORD de anfitrião aprovado do seed real.");
  const response = await page.request.post("/api/auth/sessions/login", {
    headers: { origin: baseURL!, "x-pethost-request": "1" },
    data: { email, password, role: "host" },
  });
  expect(response.status()).toBe(200);
  const listResponse = await page.request.get("/api/pets/me");
  expect(listResponse.status(), "O seed deve ter perfil de anfitrião aprovado.").toBe(200);
  const list = (await listResponse.json()).data;
  await page.goto("/pets");
  await expect(page.getByRole("heading", { name: "Pets da casa", level: 1 })).toBeVisible();
  for (const pet of list.pets.filter((item: { isActive: boolean }) => item.isActive))
    await expect(page.getByRole("link", { name: `Ficha de ${pet.name}`, exact: true })).toBeVisible();
  const showcase = await page.request.get(`/api/hosts/${list.keeper.id}/pets`);
  expect(showcase.status()).toBe(200);
  expect((await showcase.json()).data.pets.every((pet: { isActive: boolean }) => pet.isActive)).toBe(true);
});
