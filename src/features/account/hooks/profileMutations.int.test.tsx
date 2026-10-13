import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { accountProfileFixture, ownerProfileDtoFixture, hostProfileDtoFixture } from "@/test/fixtures/account";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { useSaveProfileMutation } from "./useSaveProfileMutation";
import { useUploadAvatarMutation } from "./useUploadAvatarMutation";
import { useRemoveAvatarMutation } from "./useRemoveAvatarMutation";
import { useChangePasswordMutation } from "./useChangePasswordMutation";
import { useDeactivateMutation } from "./useDeactivateMutation";

// O fetch/FormData do runner são do Node; Blob e File precisam vir do mesmo runtime.
vi.hoisted(async () => {
  const { Blob, File } = await import("node:buffer");
  const form = await new Response("", { headers: { "content-type": "application/x-www-form-urlencoded" } }).formData();
  const FormData = form.constructor;
  vi.stubGlobal("Blob", Blob);
  vi.stubGlobal("File", File);
  vi.stubGlobal("FormData", FormData);
});
afterAll(() => vi.unstubAllGlobals());

function setup<T>(useHook: () => T) {
  let current: T;
  function Probe() {
    current = useHook();
    return null;
  }
  const providers = renderWithProviders(<Probe />);
  providers.queryClient.setQueryData(accountQueryKey("one", "profile"), accountProfileFixture);
  providers.queryClient.setQueryData(accountQueryKey("other", "profile"), accountProfileFixture);
  return { ...providers, current: () => current! };
}
it.each(["owner", "host"] as const)("REQ-ACC-012 salvar %s atualiza só o cache do usuário", async (role) => {
  const dto = role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture;
  let body: unknown;
  server.use(
    http.patch(`*/api/${role}s/me`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(apiOk({ ...dto, user: { ...dto.user, fullName: "Nome novo" } }));
    }),
  );
  const probe = setup(() => useSaveProfileMutation("one", role));
  act(() => probe.current().mutate({ fullName: "Nome novo" }));
  await waitFor(() => expect(probe.current().isSuccess).toBe(true));
  expect(body).toEqual({ fullName: "Nome novo" });
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toMatchObject({ fullName: "Nome novo" });
  expect(probe.queryClient.getQueryData(accountQueryKey("other", "profile"))).toEqual(accountProfileFixture);
});
it.each(["owner", "host"] as const)("REQ-ACC-015/016 upload e remoção %s atualizam foto no cache", async (role) => {
  const dto = role === "owner" ? ownerProfileDtoFixture : hostProfileDtoFixture;
  server.use(
    http.put(`*/api/${role}s/me/avatar`, async ({ request }) => {
      const body = await request.text();
      expect(body).toContain('name="file"; filename="foto.png"');
      expect(body).toContain("\r\nfoto\r\n");
      return HttpResponse.json(
        apiOk({ ...dto, user: { ...dto.user, avatarUrl: "https://images.example.test/photo.png" } }),
      );
    }),
    http.delete(`*/api/${role}s/me/avatar`, () => HttpResponse.json(apiOk(dto))),
  );
  const probe = setup(() => ({
    upload: useUploadAvatarMutation("one", role),
    remove: useRemoveAvatarMutation("one", role),
  }));
  act(() => probe.current().upload.mutate(new File(["foto"], "foto.png", { type: "image/png" })));
  await waitFor(() => expect(probe.current().upload.isSuccess).toBe(true));
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toMatchObject({
    avatarUrl: "https://images.example.test/photo.png",
  });
  act(() => probe.current().remove.mutate());
  await waitFor(() => expect(probe.current().remove.isSuccess).toBe(true));
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toMatchObject({ avatarUrl: null });
});
it("REQ-ACC-007/017 falha ao salvar ou enviar foto conserva perfil anterior", async () => {
  server.use(
    http.patch("*/api/owners/me", () => HttpResponse.json(apiFail("OWNER_CPF_LOCKED"), { status: 422 })),
    http.put("*/api/owners/me/avatar", () => HttpResponse.json(apiFail("PAYLOAD_TOO_LARGE"), { status: 413 })),
  );
  const probe = setup(() => ({
    save: useSaveProfileMutation("one", "owner"),
    upload: useUploadAvatarMutation("one", "owner"),
  }));
  act(() => probe.current().save.mutate({ cpf: "16899535009" }));
  await waitFor(() => expect(probe.current().save.error).toMatchObject({ code: "OWNER_CPF_LOCKED" }));
  act(() => probe.current().upload.mutate(new File(["foto"], "foto.png", { type: "image/png" })));
  await waitFor(() => expect(probe.current().upload.error).toMatchObject({ code: "PAYLOAD_TOO_LARGE" }));
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toEqual(accountProfileFixture);
});
it("REQ-ACC-019 senha nova abre sessão mas deixa queries intactas", async () => {
  let body: unknown;
  server.use(
    http.post("*/api/users/me/password", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(apiOk({ user: sessionUserFixture }));
    }),
  );
  const probe = setup(useChangePasswordMutation);
  const values = { currentPassword: "antiga", newPassword: "Abcdef1!" };
  act(() => probe.current().mutate(values));
  await waitFor(() => expect(probe.current().isSuccess).toBe(true));
  expect(body).toEqual(values);
  expect(probe.current().data).toEqual({ user: sessionUserFixture });
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toEqual(accountProfileFixture);
});
it("REQ-ACC-020/028 senha errada e 429 preservam cache e detalhes", async () => {
  server.use(
    http.post("*/api/users/me/password", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "Inválido", [{ field: "currentPassword", messages: ["Confira a senha."] }]),
        { status: 400 },
      ),
    ),
  );
  const probe = setup(useChangePasswordMutation);
  act(() => probe.current().mutate({ currentPassword: "errada", newPassword: "Abcdef1!" }));
  await waitFor(() =>
    expect(probe.current().error).toMatchObject({ fieldErrors: { currentPassword: ["Confira a senha."] } }),
  );
  server.use(
    http.post("*/api/users/me/password", () =>
      HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "8" } }),
    ),
  );
  act(() => probe.current().mutate({ currentPassword: "antiga", newPassword: "Abcdef1!" }));
  await waitFor(() => expect(probe.current().error).toMatchObject({ retryAfterSeconds: 8 }));
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toEqual(accountProfileFixture);
});
it.each(["owner", "host"] as const)(
  "REQ-ACC-024 pausa %s aguarda logout antes de limpar cache e não navega",
  async (role) => {
    const order: string[] = [];
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`*/api/${role}s/me/deactivate`, () => {
        order.push("pausa");
        return HttpResponse.json(apiOk({}));
      }),
      http.post("*/api/auth/sessions/logout", async () => {
        order.push("logout");
        await pending;
        return HttpResponse.json(apiOk({}));
      }),
    );
    const location = window.location.href;
    const probe = setup(() => useDeactivateMutation(role));
    act(() => probe.current().mutate());
    await waitFor(() => expect(order).toEqual(["pausa", "logout"]));
    expect(probe.queryClient.getQueryCache().getAll()).toHaveLength(2);
    expect(probe.current().isPending).toBe(true);
    await act(async () => release());
    await waitFor(() => expect(probe.current().isSuccess).toBe(true));
    expect(probe.queryClient.getQueryCache().getAll()).toEqual([]);
    expect(probe.queryClient.getMutationCache().getAll()).toEqual([]);
    expect(window.location.href).toBe(location);
  },
);
it.each(["http", "rede"])("REQ-ACC-024 logout com falha %s não desfaz pausa e cache é limpo", async (failure) => {
  server.use(
    http.post("*/api/owners/me/deactivate", () => HttpResponse.json(apiOk({}))),
    http.post("*/api/auth/sessions/logout", () =>
      failure === "rede" ? HttpResponse.error() : HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 }),
    ),
  );
  const probe = setup(() => useDeactivateMutation("owner"));
  act(() => probe.current().mutate());
  await waitFor(() => expect(probe.current().isSuccess).toBe(true));
  expect(probe.queryClient.getQueryCache().getAll()).toEqual([]);
});
it("REQ-ACC-025 pausa recusada não faz logout nem limpa perfil", async () => {
  let logouts = 0;
  server.use(
    http.post("*/api/hosts/me/deactivate", () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 })),
    http.post("*/api/auth/sessions/logout", () => {
      logouts++;
      return HttpResponse.json(apiOk({}));
    }),
  );
  const probe = setup(() => useDeactivateMutation("host"));
  act(() => probe.current().mutate());
  await waitFor(() => expect(probe.current().isError).toBe(true));
  expect(logouts).toBe(0);
  expect(probe.queryClient.getQueryData(accountQueryKey("one", "profile"))).toEqual(accountProfileFixture);
});
