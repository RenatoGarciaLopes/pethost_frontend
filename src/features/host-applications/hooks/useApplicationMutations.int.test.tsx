import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { allDocumentsDto, hostApplicationDto, myApplicationDto, SYNTHETIC_CPF } from "@/test/fixtures/hostApplication";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { myApplicationQueries } from "../api/queries";
import {
  useCancelApplication,
  useSaveApplicationData,
  useSubmitApplication,
  useUploadDocuments,
} from "./useApplicationMutations";

const ACCOUNT = "account-1";
const pfValues = { personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" } as const;

interface FakeServer {
  application: Record<string, unknown> | null;
}

/** GET da verificação devolvendo o estado atual do "servidor" fake; devolve a contagem de leituras. */
function serveMine(state: FakeServer) {
  let gets = 0;
  server.use(
    http.get("*/api/hosts/me/application", () => {
      gets += 1;
      return HttpResponse.json(apiOk(myApplicationDto({ application: state.application })));
    }),
  );
  return () => gets;
}

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    () => ({
      mine: useQuery(myApplicationQueries.mine(ACCOUNT)),
      save: useSaveApplicationData(ACCOUNT),
      upload: useUploadDocuments(ACCOUNT),
      submit: useSubmitApplication(ACCOUNT),
      cancel: useCancelApplication(ACCOUNT),
    }),
    { wrapper },
  );
}

describe("useApplicationMutations", () => {
  it("REQ-HVER-005 POST na primeira vez e PATCH depois; nada mudou não chama a API", async () => {
    const state: FakeServer = { application: null };
    serveMine(state);
    const calls: string[] = [];
    server.use(
      http.post("*/api/hosts/me/application", () => {
        calls.push("POST");
        state.application = hostApplicationDto();
        return HttpResponse.json(apiOk(state.application), { status: 201 });
      }),
      http.patch("*/api/hosts/me/application", async ({ request }) => {
        calls.push(`PATCH ${JSON.stringify(await request.json())}`);
        state.application = hostApplicationDto({ documentType: "rg" });
        return HttpResponse.json(apiOk(state.application));
      }),
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.mine.data?.application).toBeNull());

    await act(() => result.current.save.mutateAsync(pfValues));
    await waitFor(() => expect(result.current.mine.data?.application?.status).toBe("draft"));
    await act(() => result.current.save.mutateAsync(pfValues));
    await act(() => result.current.save.mutateAsync({ ...pfValues, documentType: "rg" }));

    expect(calls).toEqual(["POST", 'PATCH {"documentType":"rg"}']);
    await waitFor(() => expect(result.current.mine.data?.application?.documentType).toBe("rg"));
  });

  it("REQ-HVER-008 fotos enviadas atualizam o que falta; erro de vaga não é repetido sozinho", async () => {
    const state: FakeServer = { application: hostApplicationDto() };
    serveMine(state);
    let puts = 0;
    server.use(
      http.put("*/api/hosts/me/application/documents", () => {
        puts += 1;
        if (puts === 1)
          return HttpResponse.json(
            apiFail("VALIDATION_ERROR", "invalid", [{ field: "back", messages: ["Arquivo inválido"] }]),
            { status: 400 },
          );
        state.application = hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] });
        return HttpResponse.json(apiOk(state.application));
      }),
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.mine.data?.application?.missingDocuments).toHaveLength(3));
    const files = { front: new File(["f"], "f.jpg"), back: new File(["b"], "b.jpg"), selfie: new File(["s"], "s.jpg") };

    await act(async () => {
      await expect(result.current.upload.mutateAsync(files)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });
    expect(puts).toBe(1);
    await act(() => result.current.upload.mutateAsync(files));
    await waitFor(() => expect(result.current.mine.data?.application?.missingDocuments).toEqual([]));
  });

  it("REQ-HVER-010 REQ-HVER-013 enviar e desistir gravam a resposta e relêem a verificação", async () => {
    const state: FakeServer = { application: hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] }) };
    const gets = serveMine(state);
    server.use(
      http.post("*/api/hosts/me/application/submission", () => {
        state.application = hostApplicationDto({ status: "submitted", missingDocuments: [] });
        return HttpResponse.json(apiOk(state.application));
      }),
      http.delete("*/api/hosts/me/application", () => {
        state.application = hostApplicationDto({ status: "cancelled", missingDocuments: [] });
        return HttpResponse.json(apiOk(state.application));
      }),
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.mine.data?.application?.status).toBe("draft"));

    await act(() => result.current.submit.mutateAsync());
    await waitFor(() => expect(result.current.mine.data?.application?.status).toBe("submitted"));
    await act(() => result.current.cancel.mutateAsync());
    await waitFor(() => expect(result.current.mine.data?.application?.status).toBe("cancelled"));
    // Depois de cada mutação a verificação é relida: tentativas e "pode começar de novo" mudam no servidor.
    await waitFor(() => expect(gets()).toBeGreaterThanOrEqual(3));
  });
});
