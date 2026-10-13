import { messageFor, router, createProfileSetup } from "@/test/profileEditor";
import { ProfileEditor } from "./ProfileEditor";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { ownerProfileDtoFixture, hostProfileDtoFixture } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
const setupProfile = createProfileSetup(ProfileEditor);
// Multipart e fetch usam o mesmo runtime, sem simular o gateway nem o hook.
vi.hoisted(async () => {
  const { Blob, File } = await import("node:buffer");
  const form = await new Response("", { headers: { "content-type": "application/x-www-form-urlencoded" } }).formData();
  vi.stubGlobal("Blob", Blob);
  vi.stubGlobal("File", File);
  vi.stubGlobal("FormData", form.constructor);
});
afterAll(() => vi.unstubAllGlobals());
it.each(["owner", "host"] as const)(
  "REQ-ACC-014/015/016 foto de %s envia multipart, atualiza cartão e remove depois da confirmação",
  async (role) => {
    const dto = role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture;
    let uploads = 0,
      removes = 0;
    server.use(
      http.put("*/api/" + role + "s/me/avatar", async ({ request }) => {
        uploads++;
        expect(request.headers.get("content-type")).toContain("multipart/form-data; boundary=");
        const body = await request.text();
        expect(body).toContain('name="file"; filename="foto.png"');
        expect(body).toContain("imagem sintética");
        return HttpResponse.json(
          apiOk({ ...dto, user: { ...dto.user, avatarUrl: "https://images.example.test/nova.png" } }),
        );
      }),
      http.delete("*/api/" + role + "s/me/avatar", () => {
        removes++;
        return HttpResponse.json(apiOk(dto));
      }),
    );
    const { user, queryClient } = await setupProfile(role, dto);
    await user.upload(
      screen.getByLabelText("Trocar foto"),
      new File(["imagem sintética"], "foto.png", { type: "image/png" }),
    );
    expect(screen.getByAltText("Prévia da sua foto")).toBeInTheDocument();
    expect(uploads).toBe(0);
    await user.click(screen.getByRole("button", { name: "Usar esta foto" }));
    await waitFor(() =>
      expect(screen.getByAltText("Sua foto do perfil")).toHaveAttribute("src", "https://images.example.test/nova.png"),
    );
    expect(screen.queryByAltText("Prévia da sua foto")).not.toBeInTheDocument();
    expect(uploads).toBe(1);
    expect(queryClient.getQueryData(accountQueryKey("user-1", "profile"))).toMatchObject({
      avatarUrl: "https://images.example.test/nova.png",
    });
    expect(router.refresh).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Tirar foto" }));
    expect(screen.getByRole("dialog", { name: "Tirar sua foto do perfil?" })).toBeInTheDocument();
    expect(removes).toBe(0);
    await user.click(screen.getByRole("button", { name: "Tirar" }));
    await waitFor(() => expect(screen.queryByAltText("Sua foto do perfil")).not.toBeInTheDocument());
    expect(removes).toBe(1);
    expect(router.refresh).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(accountQueryKey("user-1", "profile"))).toMatchObject({ avatarUrl: null });
  },
);
it.each([413, 400])(
  "REQ-ACC-017 erro %s na foto aparece associado ao controle sem alterar o cartão",
  async (status) => {
    server.use(
      http.put("*/api/owners/me/avatar", () =>
        HttpResponse.json(
          status === 413
            ? apiFail("PAYLOAD_TOO_LARGE")
            : apiFail("VALIDATION_ERROR", "Inválido", [{ field: "file", messages: ["Arquivo inválido."] }]),
          { status },
        ),
      ),
    );
    const { user } = await setupProfile();
    await user.upload(screen.getByLabelText("Trocar foto"), new File(["foto"], "foto.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Usar esta foto" }));
    await screen.findByText(messageFor("PAYLOAD_TOO_LARGE"));
    expect(screen.getByLabelText("Trocar foto")).toHaveAccessibleDescription(messageFor("PAYLOAD_TOO_LARGE"));
    expect(screen.getByAltText("Prévia da sua foto")).toBeInTheDocument();
  },
);
