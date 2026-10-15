import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { petQueries } from "../../../api/queries";
import { HouseResidents } from "./HouseResidents";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it.each([
  [404, "PET_HOST_NOT_FOUND"],
  [500, "UNEXPECTED_ERROR"],
])("REQ-HPETS-008 falha %s some e registra só código/status em desenvolvimento", async (status, code) => {
  vi.stubEnv("NODE_ENV", "development");
  const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  let calls = 0;
  server.use(
    http.get("*/api/hosts/:hostId/pets", () => {
      calls++;
      return HttpResponse.json(apiFail(String(code), "private raw error"), { status: Number(status) });
    }),
  );
  const { container, queryClient } = renderWithProviders(<HouseResidents hostId="synthetic-profile" />);
  await waitFor(() =>
    expect(queryClient.getQueryState(petQueries.house("synthetic-profile").queryKey)?.status).toBe("error"),
  );
  await waitFor(() => expect(log).toHaveBeenCalledWith("HouseResidents", { status, code }));
  expect(container).toBeEmptyDOMElement();
  expect(calls).toBe(1);
  expect(JSON.stringify(log.mock.calls)).not.toContain("private raw error");
});
it("REQ-HPETS-006/009 lê via BFF e só mostra os ativos sem armazenar ficha privada", async () => {
  server.use(
    http.get("*/api/hosts/:hostId/pets", () =>
      HttpResponse.json(
        apiOk({
          keeper: { ...petKeeperDto, type: "host" },
          pets: [
            petDto({ name: "Bóris", notes: "privado", microchip: "123456789012345" }),
            petDto({ name: "Inativo", isActive: false }),
          ],
        }),
      ),
    ),
  );
  const { queryClient } = renderWithProviders(<HouseResidents hostId="profile" />);
  expect(await screen.findByText("Bóris")).toBeVisible();
  expect(screen.queryByText("Inativo")).not.toBeInTheDocument();
  expect(JSON.stringify(queryClient.getQueryData(petQueries.house("profile").queryKey))).not.toMatch(
    /microchip|privado|123456789012345/,
  );
});
it("REQ-HPETS-008 produção permanece silenciosa", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  server.use(
    http.get("*/api/hosts/:hostId/pets", () => HttpResponse.json(apiFail("PET_HOST_NOT_FOUND"), { status: 404 })),
  );
  const { container, queryClient } = renderWithProviders(<HouseResidents hostId="missing" />);
  await waitFor(() => expect(queryClient.getQueryState(petQueries.house("missing").queryKey)?.status).toBe("error"));
  expect(container).toBeEmptyDOMElement();
  expect(log).not.toHaveBeenCalled();
});
it("REQ-HPETS-008 refetch falhando esconde também dados antigos em cache", async () => {
  server.use(
    http.get("*/api/hosts/:hostId/pets", () => HttpResponse.json(apiOk({ keeper: petKeeperDto, pets: [petDto()] }))),
  );
  const { container, queryClient } = renderWithProviders(<HouseResidents hostId="refetch-profile" />);
  expect(await screen.findByText("Thor")).toBeVisible();
  server.use(
    http.get("*/api/hosts/:hostId/pets", () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })),
  );
  await queryClient.invalidateQueries({ queryKey: petQueries.house("refetch-profile").queryKey });
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});
