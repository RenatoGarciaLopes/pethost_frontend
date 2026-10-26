import { File as NodeFile } from "node:buffer";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { petDto } from "@/test/fixtures/pets";
import { apiOk, apiFail, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../api/queries";
import { toPetDetail } from "../api/toPetDetail";
import { petDtoSchema } from "../api/contracts";
import { usePetPhotoMutations } from "./usePetPhotoMutations";
beforeEach(async () => {
  // Mesmo runtime do fetch; evita File/FormData incompatíveis do jsdom.
  const native = await new Request("http://browser.test", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "",
  }).formData();
  vi.stubGlobal("File", NodeFile);
  vi.stubGlobal("FormData", native.constructor);
});
afterEach(() => vi.unstubAllGlobals());
const id = petDto().id;
const file = () => new File(["imagem"], "foto.jpg", { type: "image/jpeg" });
function setup() {
  const client = createTestQueryClient();
  client.setQueryData(petQueries.detail("a", id).queryKey, toPetDetail(petDtoSchema.parse(petDto())));
  client.setQueryData(petQueries.mine("a").queryKey, { active: [], inactive: [], hostId: "profile-host" });
  client.setQueryData(petQueries.house("profile-host").queryKey, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () => ({ photos: usePetPhotoMutations("a", id), detail: useQuery(petQueries.detail("a", id)) }),
    { wrapper },
  );
  return { ...hook, client };
}
it("REQ-PEDIT-008/014 ignora concorrência até resposta e atualiza só lista e detalhe", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let sends = 0;
  server.use(
    http.post("*/api/pets/:id/photos", async () => {
      sends++;
      await gate;
      return HttpResponse.json(apiOk(petDto({ name: "Mel" })));
    }),
  );
  const { result, client } = setup();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.photos.add(0, file());
  });
  await waitFor(() => expect(result.current.photos.busySlot).toBe(0));
  await act(async () => {
    await result.current.photos.replace(1, "other", file());
  });
  expect(sends).toBe(1);
  await act(async () => {
    release();
    await pending;
  });
  expect(result.current.photos.busySlot).toBeNull();
  expect(result.current.detail.data?.values.name).toBe("Mel");
  expect(client.getQueryState(petQueries.mine("a").queryKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(petQueries.house("profile-host").queryKey)?.isInvalidated).toBe(true);
  client.clear();
});
it("REQ-PEDIT-009 substituição renova após 401 e reenvia mesmo arquivo uma vez", async () => {
  let sends = 0;
  let refreshes = 0;
  server.use(
    http.patch("*/api/pets/:id/photos/:photoId", async ({ request }) => {
      const body = await request.text();
      expect(body).toContain('name="file"; filename="upload.jpg"');
      expect(body).toContain("imagem");
      return ++sends === 1
        ? HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 })
        : HttpResponse.json(apiOk(petDto()));
    }),
    http.post("*/api/auth/sessions/refresh", () => {
      refreshes++;
      return HttpResponse.json(apiOk({ user: sessionUserFixture }));
    }),
  );
  const { result, client } = setup();
  await act(async () => {
    await result.current.photos.replace(1, "photo", file());
  });
  expect(sends).toBe(2);
  expect(refreshes).toBe(1);
  expect(result.current.photos.errors).toEqual([null, null, null]);
  client.clear();
});
it.each([
  [409, "PET_PHOTO_ALREADY_EXISTS", "Essa foto já está na ficha."],
  [422, "PET_PHOTO_LIMIT_REACHED", "Já tem 3 fotos. Tira uma pra colocar outra."],
])("REQ-PEDIT-010 mostra erro %s apenas na vaga e permite limpar", async (status, code, message) => {
  server.use(
    http.post("*/api/pets/:id/photos", () => HttpResponse.json(apiFail(String(code)), { status: Number(status) })),
  );
  const { result, client } = setup();
  await act(async () => {
    await result.current.photos.add(2, file());
  });
  expect(result.current.photos.errors).toEqual([null, null, message]);
  act(() => result.current.photos.clearError(2));
  expect(result.current.photos.errors).toEqual([null, null, null]);
  client.clear();
});
it("REQ-PEDIT-010 foto ausente refaz detalhe sem erro; remoção posterior grava resposta", async () => {
  let gets = 0;
  server.use(
    http.delete("*/api/pets/:id/photos/:photoId", () =>
      HttpResponse.json(apiFail("PET_PHOTO_NOT_FOUND"), { status: 404 }),
    ),
    http.get("*/api/pets/:id", () => {
      gets++;
      return HttpResponse.json(apiOk(petDto({ photos: [] })));
    }),
  );
  const { result, client } = setup();
  await act(async () => {
    await result.current.photos.remove(0, "gone");
  });
  expect(gets).toBe(1);
  expect(result.current.detail.data?.photos).toEqual([]);
  expect(result.current.photos.errors).toEqual([null, null, null]);
  server.use(http.delete("*/api/pets/:id/photos/:photoId", () => HttpResponse.json(apiOk(petDto({ photos: [] })))));
  await act(async () => {
    await result.current.photos.remove(0, "photo");
  });
  expect(gets).toBe(1);
  client.clear();
});
