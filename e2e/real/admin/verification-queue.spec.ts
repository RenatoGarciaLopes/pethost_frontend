import { expect, test } from "@playwright/test";
import { waitForHydration } from "../../support/hydration";

// Exige uma conta pessoal descartável, verificada e sem solicitação aberta, e o admin do ambiente de teste.
test("REQ-AQUEUE-001/010/012 admin decide solicitação criada nesta jornada na API real", async ({ page, baseURL }) => {
  const applicantEmail = process.env.E2E_REVIEW_APPLICANT_EMAIL;
  const applicantPassword = process.env.E2E_REVIEW_APPLICANT_PASSWORD;
  const cpf = process.env.E2E_REVIEW_SYNTHETIC_CPF;
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  test.skip(
    !applicantEmail || !applicantPassword || !cpf || !adminEmail || !adminPassword,
    "Configure contas descartáveis de teste e CPF sintético para a jornada real.",
  );
  const headers = { origin: baseURL!, "x-pethost-request": "1" };
  const login = await page.request.post("/api/auth/sessions/login", {
    headers,
    data: { email: applicantEmail, password: applicantPassword, role: "host" },
  });
  expect(login.ok()).toBe(true);
  const created = await page.request.post("/api/hosts/me/application", {
    headers,
    data: { cpf, documentType: "cnh", personType: "pf", acceptNotice: true },
  });
  expect(created.ok()).toBe(true);
  const applicationId: string = (await created.json()).data.id;
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZ8AAAAASUVORK5CYII=",
    "base64",
  );
  try {
    for (const [index, kind] of ["front", "back", "selfie"].entries()) {
      const uploaded = await page.request.put("/api/hosts/me/application/documents", {
        headers,
        multipart: {
          [kind]: {
            name: `${kind}.png`,
            mimeType: "image/png",
            buffer: Buffer.concat([image, Buffer.from(String(index))]),
          },
        },
      });
      expect(uploaded.ok()).toBe(true);
    }
    expect((await page.request.post("/api/hosts/me/application/submission", { headers })).ok()).toBe(true);
    expect(
      (
        await page.request.post("/api/auth/sessions/login", {
          headers,
          data: { email: adminEmail, password: adminPassword, role: "admin" },
        })
      ).ok(),
    ).toBe(true);
    await page.goto(`/admin/host-applications/${applicationId}`);
    const reason = page.getByRole("textbox", { name: "Nota interna (motivo da decisão)" });
    await waitForHydration(reason);
    await reason.fill("Documentos fictícios da jornada automatizada, sem identidade real.");
    await page.getByRole("button", { name: "Outro motivo", exact: true }).click();
    await page.getByRole("button", { name: "Recusar", exact: true }).click();
    await expect(page.getByText("Decisão registrada.")).toBeVisible();
  } finally {
    // Se a UI falhar, encerra somente esta solicitação criada pelo teste; não toca na fila preexistente.
    await page.request.post("/api/auth/sessions/login", {
      headers,
      data: { email: adminEmail, password: adminPassword, role: "admin" },
    });
    const current = await page.request.get(`/api/host-applications/${applicationId}`);
    if (current.ok()) {
      const status = (await current.json()).data.status;
      if (status === "submitted")
        expect(
          (
            await page.request.post(`/api/host-applications/${applicationId}/rejection`, {
              headers,
              data: {
                rejectionReason: "other",
                reason: "Encerramento da solicitação sintética da jornada automatizada.",
              },
            })
          ).ok(),
        ).toBe(true);
      if (status === "draft") {
        expect(
          (
            await page.request.post("/api/auth/sessions/login", {
              headers,
              data: { email: applicantEmail, password: applicantPassword, role: "host" },
            })
          ).ok(),
        ).toBe(true);
        expect((await page.request.delete("/api/hosts/me/application", { headers })).ok()).toBe(true);
      }
    }
  }
});
