import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import type { OwnerRegistrationValues } from "../schemas/ownerRegistrationSchema";
import { useRegisterMutation } from "./useRegisterMutation";

const values: OwnerRegistrationValues = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "15031990",
  cpf: "52998224725",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

function setup() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(["account", "outra-conta", "pets"], [{ id: "pet-1" }]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useRegisterMutation(), { wrapper }) };
}

describe("useRegisterMutation", () => {
  it("REQ-OREG-013 sucesso tira as queries do cache e mantém o resultado da mutação", async () => {
    server.use(
      http.post("*/api/owners/register", () => HttpResponse.json(apiOk({ user: sessionUserFixture }), { status: 201 })),
    );
    const { queryClient, result } = setup();

    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ user: sessionUserFixture });
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
  });

  it("REQ-OREG-013 erro não mexe no cache e chega como ApiError", async () => {
    server.use(
      http.post("*/api/owners/register", () =>
        HttpResponse.json(apiFail("AUTH_EMAIL_ALREADY_REGISTERED"), { status: 409 }),
      ),
    );
    const { queryClient, result } = setup();

    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 409, code: "AUTH_EMAIL_ALREADY_REGISTERED" });
    expect(queryClient.getQueryData(["account", "outra-conta", "pets"])).toEqual([{ id: "pet-1" }]);
  });
});
