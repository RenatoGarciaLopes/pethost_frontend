import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { PetList } from "./PetList";

const THOR = "0199d2a0-0000-7000-8000-000000000001";
const LUNA = "0199d2a0-0000-7000-8000-000000000002";
const MEL = "0199d2a0-0000-7000-8000-000000000003";

function respond(pets: ReturnType<typeof petDto>[]) {
  let calls = 0;
  server.use(
    http.get("*/api/pets/me", () => {
      calls += 1;
      return HttpResponse.json(apiOk({ keeper: petKeeperDto, pets }));
    }),
  );
  return () => calls;
}

function setup() {
  return renderWithProviders(<PetList accountId="account-1" />, { theme: quintalTheme });
}

describe("meus pets", () => {
  it("REQ-PETS-001 REQ-PETS-002 carteirinhas na ordem da API, cada uma um link único para a ficha", async () => {
    respond([petDto({ id: LUNA, name: "Luna", species: "cat", size: null, breed: null }), petDto({ id: THOR })]);
    setup();

    const cards = await screen.findAllByRole("link", { name: /^Ficha de / });
    expect(cards.map((card) => within(card).getByRole("heading").textContent)).toEqual([
      "Ficha de Luna",
      "Ficha de Thor",
    ]);
    expect(cards[1]).toHaveAttribute("href", `/pets/${THOR}`);
    expect(within(cards[1]).getByText(/^Vira-lata · porte médio · \d+ anos · macho · castrado$/)).toBeInTheDocument();
    expect(within(cards[0]).getByText(/^Gato/)).toBeInTheDocument();
    // Nada clicável dentro do link (REQ-PETS-002).
    for (const card of cards) {
      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
      expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    }
  });

  it("REQ-PETS-001 sem foto mostra o avatar da esp?cie; com foto, a capa decorativa", async () => {
    respond([petDto({ id: THOR }), petDto({ id: LUNA, name: "Luna", photos: [] })]);
    const { container } = setup();
    const thor = await screen.findByRole("link", { name: /^Ficha de Thor/ });
    // alt vazio: a foto é decorativa (o nome já está no texto), então não tem papel de imagem.
    expect(thor.querySelector("img")).toHaveAttribute("src", "https://cdn.pethost.test/thor.jpg");
    expect(thor.querySelector("img")).toHaveAttribute("alt", "");
    const luna = screen.getByRole("link", { name: /^Ficha de Luna/ });
    expect(luna.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(container.querySelector('img:not([alt=""])')).toBeNull();
  });

  it("REQ-PETS-003 'Apresentar outro pet' leva ao cadastro", async () => {
    respond([petDto({ id: THOR })]);
    setup();
    expect(await screen.findByRole("link", { name: "Apresentar outro pet" })).toHaveAttribute("href", "/pets/new");
  });

  it("REQ-PETS-004 sem nenhum pet: o convite com 'Apresentar meu pet'", async () => {
    respond([]);
    setup();
    expect(await screen.findByText("Apresenta seu pet pra gente? Leva uns 3 minutos.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apresentar meu pet" })).toHaveAttribute("href", "/pets/new");
    expect(screen.queryByRole("link", { name: "Apresentar outro pet" })).not.toBeInTheDocument();
  });

  it("REQ-PETS-005 inativos ficam em 'Fora da lista', recolhida; abrir mostra as carteirinhas", async () => {
    respond([petDto({ id: THOR }), petDto({ id: MEL, name: "Mel", isActive: false })]);
    const { user } = setup();
    const toggle = await screen.findByRole("button", { name: "Fora da lista (1)" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /^Ficha de Mel/ })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /^Ficha de Mel/ })).toBeVisible();
    expect(screen.getByText("As fichas continuam aqui. As estadias antigas também.")).toBeInTheDocument();
  });

  it("REQ-PETS-004 só inativos: sem convite de primeiro pet, com o tile e a seção", async () => {
    respond([petDto({ id: MEL, name: "Mel", isActive: false })]);
    setup();
    expect(await screen.findByRole("button", { name: "Fora da lista (1)" })).toBeInTheDocument();
    expect(screen.queryByText(/Apresenta seu pet pra gente/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apresentar outro pet" })).toBeInTheDocument();
  });

  it("REQ-PETS-008 falha mostra a frase e 'Tentar de novo' busca outra vez", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/pets/me", () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(apiFail("INTERNAL_ERROR"), { status: 500 })
          : HttpResponse.json(apiOk({ keeper: petKeeperDto, pets: [petDto({ id: THOR })] }));
      }),
    );
    const { user } = setup();
    expect(await screen.findByText("Não deu pra ver seus pets agora.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("link", { name: /^Ficha de Thor/ })).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});
it("REQ-HPETS-001 lista de anfitrião usa convite e tile de pets da casa", async () => {
  respond([]);
  renderWithProviders(<PetList accountId="host" role="host" />, { theme: quintalTheme });
  expect(await screen.findByText("Tem bicho morando com você? Apresenta pra quem vai se hospedar aí.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Apresentar um pet da casa" })).toHaveAttribute("href", "/pets/new");
});
it("REQ-HPETS-002 404 de keeper no cliente é bloqueio normal, sem tentar de novo", async () => {
  server.use(http.get("*/api/pets/me", () => HttpResponse.json(apiFail("PET_KEEPER_NOT_FOUND"), { status: 404 })));
  renderWithProviders(<PetList accountId="host" role="host" />, { theme: quintalTheme });
  expect(await screen.findByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Apresentar um pet da casa" })).not.toBeInTheDocument();
});
