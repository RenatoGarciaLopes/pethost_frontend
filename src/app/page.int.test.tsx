import { isValidElement, type ReactElement, type ReactNode } from "react";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { apiFail, apiOk, fakeJwt, nowSeconds, sessionUserFixture } from "@/test/fixtures/session";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/msw/server";
import HomePage, { metadata } from "./page";

const requestState = vi.hoisted(() => ({
  accessToken: undefined as string | undefined,
  events: [] as string[],
  connection: vi.fn(async () => {
    requestState.events.push("connection");
  }),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: requestState.connection,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "pethost_at" && requestState.accessToken ? { value: requestState.accessToken } : undefined,
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn() }),
}));

function authenticate(role: "owner" | "host") {
  requestState.accessToken = fakeJwt(nowSeconds() + 600);
  server.use(
    http.get("http://api.test/api/v1/users/me", () => {
      requestState.events.push("session");
      return HttpResponse.json(apiOk({ ...sessionUserFixture, role }));
    }),
  );
}

async function resolveHomeContent() {
  const page = HomePage();
  const content = page.props.children as ReactElement;
  const renderContent = content.type as () => Promise<ReactNode>;
  const resolved = await renderContent();
  if (!isValidElement(resolved)) throw new Error("HomeContent não retornou uma composição React.");
  return resolved;
}

afterEach(() => {
  getQueryClient().clear();
  requestState.accessToken = undefined;
  requestState.events.splice(0);
  requestState.connection.mockClear();
});

it("REQ-HOME-001 home pública tem metadata e não consulta sessão sem cookie", async () => {
  expect(metadata.title).toBe("Início · PetHost");
  renderWithProviders(await resolveHomeContent(), { theme: quintalTheme });
  expect(screen.getByRole("heading", { name: "Um quintal pro seu pet enquanto você viaja." })).toBeVisible();
  expect(requestState.events).toEqual(["connection"]);
  expect(requestState.connection).toHaveBeenCalledOnce();
});

it("REQ-HOME-010 fallback de carregamento não oferece busca com destino incompleto", () => {
  const page = HomePage();
  renderWithProviders(page.props.fallback as ReactElement, { theme: quintalTheme });
  expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Preparando seu quintal");
  expect(screen.queryByRole("form", { name: "Busca de cantinhos" })).not.toBeInTheDocument();
});

it("REQ-HOME-003 busca pets ativos só para tutor e usa a sessão antes da lista", async () => {
  authenticate("owner");
  server.use(
    http.get("http://api.test/api/v1/pets/me", () => {
      requestState.events.push("pets");
      return HttpResponse.json(
        apiOk({
          keeper: petKeeperDto,
          pets: [petDto({ name: "Mel" }), petDto({ name: "Inativo", isActive: false })],
        }),
      );
    }),
  );

  renderWithProviders(await resolveHomeContent(), { theme: quintalTheme });
  expect(screen.getByRole("heading", { name: "Um quintal pra Mel enquanto você viaja." })).toBeVisible();
  expect(screen.queryByText("Inativo")).not.toBeInTheDocument();
  expect(requestState.events).toEqual(["connection", "session", "pets"]);
});

it("REQ-HOME-002 tutor sem pet recebe a escolha de espécie sem passo de cadastro", async () => {
  authenticate("owner");
  server.use(
    http.get("http://api.test/api/v1/pets/me", () => HttpResponse.json(apiOk({ keeper: petKeeperDto, pets: [] }))),
  );

  renderWithProviders(await resolveHomeContent(), { theme: quintalTheme });
  expect(screen.getByText("Você pode buscar antes de cadastrar seu pet.")).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeInTheDocument();
});

it("REQ-HOME-004 anfitrião não consulta lista pessoal de pets na home", async () => {
  authenticate("host");
  renderWithProviders(await resolveHomeContent(), { theme: quintalTheme });
  expect(screen.getByText("Quantos pets viajam com você?")).toBeVisible();
  expect(requestState.events).toEqual(["connection", "session"]);
});

it("REQ-HOME-009 erro na lista do tutor não impede a busca por espécie", async () => {
  authenticate("owner");
  server.use(
    http.get("http://api.test/api/v1/pets/me", () => HttpResponse.json(apiFail("FORBIDDEN"), { status: 403 })),
  );

  renderWithProviders(await resolveHomeContent(), { theme: quintalTheme });
  expect(screen.getByRole("status")).toHaveTextContent("Não conseguimos carregar seus pets agora.");
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeInTheDocument();
});
