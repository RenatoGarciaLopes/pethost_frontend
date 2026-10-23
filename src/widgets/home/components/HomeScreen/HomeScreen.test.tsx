import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { pickCalendarDays } from "@/test/calendar";
import { listingFixture } from "@/test/fixtures/search";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { HomeScreen, type HomeScreenProps } from "./HomeScreen";

// O calendário nasce em "hoje": só a data é fixada, os temporizadores seguem reais.
beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-22T12:00:00Z") }));
afterEach(() => vi.useRealTimers());

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

const petOptions = [
  { id: "pet-pipoca", name: "Pipoca", species: "dog", size: "small" },
  { id: "pet-tico", name: "Tico", species: "cat", size: null },
];

function renderHome(overrides: Partial<HomeScreenProps> = {}, url = "/") {
  window.history.replaceState(null, "", url);
  return renderWithProviders(<HomeScreen viewer="visitor" pets={[]} petsUnavailable={false} {...overrides} />, {
    theme: quintalTheme,
  });
}

it("REQ-HOME-002 visitante busca por espécie na própria home, sem passar pelo login", async () => {
  const { user } = renderHome();
  expect(screen.getByRole("heading", { name: "Um quintal pro seu pet enquanto você viaja" })).toBeVisible();
  expect(screen.getByText("Pode olhar à vontade: a conta só entra na hora de pedir.")).toBeVisible();

  await user.type(screen.getByRole("textbox", { name: "Onde" }), "Zona 7");
  await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-11-01", "2026-11-05");
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Cão" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));

  expect(window.location.pathname + window.location.search).toBe(
    "/?species=dog&where=Zona+7&from=2026-11-01&to=2026-11-05",
  );
}, 15_000);

it("REQ-HOME-002 tutor sem pet pode escolher espécie e a busca fica na URL da home", async () => {
  const { user } = renderHome({ viewer: "owner" });
  expect(screen.getByText("Você pode buscar antes de cadastrar seu pet.")).toBeVisible();
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Gato" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(window.location.search).toBe("?species=cat");
});

it("REQ-HOME-003 tutor com pets começa personalizado e leva só os ids selecionados para a URL", async () => {
  const { user } = renderHome({ viewer: "owner", pets: petOptions });
  expect(screen.getByRole("heading", { name: "Um quintal pra Pipoca enquanto você viaja" })).toBeVisible();
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "Tico" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("heading", { name: "Um quintal pros seus pets enquanto você viaja" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(window.location.search).toBe("?pets=pet-pipoca&pets=pet-tico");
});

it("REQ-HOME-004 anfitrião escolhe quantidade sem consultar pets da casa", async () => {
  const { user } = renderHome({ viewer: "host" });
  await user.click(screen.getByRole("combobox", { name: "Pet" }));
  await user.click(screen.getByRole("option", { name: "3 pets" }));
  await user.click(screen.getByRole("button", { name: "Achar um cantinho" }));
  expect(window.location.search).toBe("?count=3");
});

it("REQ-HOME-006 no celular a pílula expande e anuncia os campos", async () => {
  const { user } = renderHome();
  const openSearch = screen.getByRole("button", { name: "Onde, datas e pet" });
  expect(openSearch).toHaveAttribute("aria-expanded", "false");
  await user.click(openSearch);
  expect(screen.getByRole("button", { name: "Fechar busca" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("textbox", { name: "Onde" })).toBeInTheDocument();
});

it("REQ-UIC-007 faixa única mostra datas legíveis e mantém três controles rotulados", async () => {
  const { user } = renderHome();
  await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-12-20", "2026-12-25");
  expect(screen.getByText("20 a 25 dez · 5 noites")).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Onde" })).toBeEnabled();
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeEnabled();
});

it("REQ-UIC-007 pergunta de quantidade do anfitrião fica fora da faixa de busca", () => {
  renderHome({ viewer: "host" });
  expect(screen.getByRole("form", { name: "Busca de cantinhos" })).not.toContainElement(
    screen.getByText("Quantos pets viajam com você?"),
  );
});

it("REQ-UIC-007 teclado alcança as três células sem controles nativos de seleção extras", async () => {
  const { user } = renderHome();
  screen.getByRole("textbox", { name: "Onde" }).focus();
  await user.tab();
  expect(screen.getByLabelText("Chegada e saída")).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("combobox", { name: "Pet" })).toHaveFocus();
});

it("REQ-HOME-009 falha ao carregar pets mantém espécie e alternativa de busca", () => {
  renderHome({ viewer: "owner", petsUnavailable: true });
  expect(screen.getByRole("status")).toHaveTextContent("Não conseguimos carregar seus pets agora.");
  expect(screen.getByRole("combobox", { name: "Pet" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Achar um cantinho" })).toBeEnabled();
});

it("REQ-HOME-010 os campos de pet não repassam atributos inválidos ao DOM", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  for (const props of [{ viewer: "visitor" }, { viewer: "owner", pets: petOptions }, { viewer: "host" }] as const) {
    renderHome(props).unmount();
  }
  expect(error.mock.calls.flat().join(" ")).not.toMatch(/non-boolean attribute/);
  error.mockRestore();
});

it("REQ-HOME-011 com filtros na URL a home mostra os resultados no lugar da vitrine, com os filtros na chamada da API", async () => {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json(apiOk({ items: [listingFixture()], page: 1, pageSize: 12, totalCount: 1 }));
    }),
  );
  renderHome(
    { initialQuery: { pets: [], species: [], sizes: [], where: "Maringá", hasYard: true } },
    "/?where=Maring%C3%A1&hasYard=true",
  );
  expect(screen.queryByRole("heading", { name: "Casas com vaga perto de você" })).not.toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "1 casa com vaga perto de Maringá" })).toBeVisible();
  expect(screen.getByRole("link", { name: /Quintal da Cida/ })).toBeVisible();
  expect(seen[0]?.get("hasYard")).toBe("true");
  expect(seen[0]?.get("city")).toBe("Maringá");
});

it("REQ-SRCH-014 com busca na URL a home mostra só os resultados: sem hero nem barra grande", () => {
  server.use(
    http.get("*/api/listings", () =>
      HttpResponse.json(apiOk({ items: [listingFixture()], page: 1, pageSize: 12, totalCount: 1 })),
    ),
  );
  renderHome({}, "/?where=Zona+7");
  expect(screen.queryByRole("heading", { name: "Um quintal pro seu pet enquanto você viaja" })).not.toBeInTheDocument();
  expect(screen.queryByRole("form", { name: "Busca de cantinhos" })).not.toBeInTheDocument();
});
