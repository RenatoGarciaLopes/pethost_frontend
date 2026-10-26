import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { accountProfileFixture, ownerProfileDtoFixture, hostProfileDtoFixture } from "@/test/fixtures/account";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { useAccountProfile } from "./useAccountProfile";
it("REQ-ACC-004 perfil fica fresco por 60 s e cache é separado por usuário", async () => {
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  let calls = 0;
  server.use(
    http.get("*/api/owners/me", () => {
      calls++;
      return HttpResponse.json(apiOk(ownerProfileDtoFixture));
    }),
  );
  const { Wrapper, queryClient } = (() => {
    const providers = renderWithProviders(<div />);
    return { queryClient: providers.queryClient, Wrapper: providers.rerender };
  })();
  // O componente de prova é renderizado com os providers reais, sem substituir o hook.
  let latest: ReturnType<typeof useAccountProfile>;
  function Probe({ userId }: { userId: string }) {
    latest = useAccountProfile(userId, "owner");
    return null;
  }
  Wrapper(<Probe userId="one" />);
  await waitFor(() => expect(latest!.isSuccess).toBe(true));
  expect(queryClient.getQueryData(accountQueryKey("one", "profile"))).toEqual(accountProfileFixture);
  vi.mocked(Date.now).mockReturnValue(now + 59_999);
  Wrapper(<Probe userId="two" />);
  await waitFor(() => expect(calls).toBe(2));
  Wrapper(<Probe userId="one" />);
  expect(latest!.isFetching).toBe(false);
  expect(calls).toBe(2);
  vi.mocked(Date.now).mockReturnValue(now + 60_001);
  Wrapper(<Probe userId="two" />);
  Wrapper(<Probe userId="one" />);
  await waitFor(() => expect(calls).toBe(3));
});
it("REQ-ACC-011 falha permite refetch com fallback de anfitrião", async () => {
  let latest: ReturnType<typeof useAccountProfile>;
  function Probe() {
    latest = useAccountProfile("one", "host");
    return null;
  }
  server.use(http.get("*/api/hosts/me", () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 })));
  renderWithProviders(<Probe />);
  await waitFor(() => expect(latest!.isError).toBe(true));
  server.use(
    http.get("*/api/hosts/me", () => HttpResponse.json(apiFail("HOST_NOT_FOUND"), { status: 404 })),
    http.get("*/api/users/me", () => HttpResponse.json(apiOk(hostProfileDtoFixture.user))),
  );
  await act(async () => {
    await latest!.refetch();
  });
  await waitFor(() => expect(latest!.data).toMatchObject({ verified: false, memberSince: null }));
});
