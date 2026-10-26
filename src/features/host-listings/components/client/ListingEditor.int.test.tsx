import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { listingDtoSchema } from "../../api/contracts";
import { toListing } from "../../api/mappers";
import { listingQueries } from "../../api/queries";
import { listingCopy as copy } from "../../lib/listingCopy";
import { ListingEditor } from "./ListingEditor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const ACCOUNT = "account-1";
const ID = listingDto().id;
beforeEach(() => window.history.replaceState(null, "", window.location.pathname + window.location.search));

function setup(overrides: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  const key = listingQueries.detail(ACCOUNT, ID).queryKey;
  queryClient.setQueryDefaults(key, { staleTime: Infinity });
  queryClient.setQueryData(key, toListing(listingDtoSchema.parse(listingDto(overrides))));
  server.use(
    http.get("*/api/listings/me", () => HttpResponse.json(apiOk(myListingsDto([listingDto()])))),
    http.get("https://viacep.com.br/ws/:cep/json/", () =>
      HttpResponse.json({
        cep: "87020-000",
        logradouro: "Avenida Brasil",
        bairro: "Zona 01",
        localidade: "Maringá",
        uf: "PR",
      }),
    ),
  );
  const view = renderWithProviders(
    <ListingEditor accountId={ACCOUNT} listingId={ID} kind="person" firstName="Cida" />,
    {
      theme: quintalTheme,
      queryClient,
    },
  );
  return { ...view, queryClient, key };
}

const section = (name: string) => screen.getByRole("region", { name });

describe("ListingEditor", { timeout: 20000 }, () => {
  it("REQ-LIST-013 mostra o cantinho por seções, com o título e o selo 'Aberto'", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Casa da Cida" })).toBeInTheDocument();
    expect(screen.getByText(copy.editor.active)).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: copy.editor.sectionsLabel });
    for (const title of Object.values(copy.sections))
      expect(within(navigation).getByRole("button", { name: new RegExp(title) })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.sections.rules })).not.toBeInTheDocument();
    expect(within(section(copy.sections.home)).getByRole("textbox", { name: copy.home.title })).toHaveValue(
      "Casa da Cida",
    );
  });

  it("REQ-LIST-013 REQ-LIST-016 salvar a seção manda só o que mudou e grava a resposta", async () => {
    let body: unknown;
    server.use(
      http.patch(`*/api/listings/${ID}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiOk(listingDto({ title: "Casa da Cida e do Bóris" })));
      }),
    );
    const { user, queryClient, key } = setup();
    const home = section(copy.sections.home);
    const title = within(home).getByRole("textbox", { name: copy.home.title });
    await user.clear(title);
    await user.type(title, "Casa da Cida e do Bóris");
    await user.click(within(home).getByRole("button", { name: copy.save(copy.sections.home) }));

    await waitFor(() => expect(within(home).getByRole("status")).toHaveTextContent(copy.saved));
    expect(body).toEqual({ title: "Casa da Cida e do Bóris" });
    expect(queryClient.getQueryData(key)?.title).toBe("Casa da Cida e do Bóris");
  });

  it("REQ-LIST-013 nada mudou: avisa e não chama a API", async () => {
    const { user } = setup();
    await user.click(
      within(screen.getByRole("navigation", { name: copy.editor.sectionsLabel })).getByRole("button", {
        name: new RegExp(copy.sections.rules),
      }),
    );
    const rules = section(copy.sections.rules);
    await user.click(within(rules).getByRole("button", { name: copy.save(copy.sections.rules) }));
    expect(within(rules).getByRole("status")).toHaveTextContent(copy.unchanged);
  });

  it("REQ-LIST-012 erro de campo da API aparece no campo da seção", async () => {
    server.use(
      http.patch(`*/api/listings/${ID}`, () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "x", [
            {
              field: "capacity",
              messages: ["Acima do limite."],
              errors: [{ code: "LISTING_CAPACITY_OUT_OF_RANGE", params: { max: 10 } }],
            },
          ]),
          {
            status: 400,
          },
        ),
      ),
    );
    const { user } = setup();
    await user.click(
      within(screen.getByRole("navigation", { name: copy.editor.sectionsLabel })).getByRole("button", {
        name: new RegExp(copy.sections.guests),
      }),
    );
    const guests = section(copy.sections.guests);
    await user.click(within(guests).getByRole("button", { name: `Aumentar ${copy.guests.capacity}` }));
    await user.click(within(guests).getByRole("button", { name: copy.save(copy.sections.guests) }));
    expect(await within(guests).findByText("O cantinho recebe de 1 a 10 pets por noite.")).toBeInTheDocument();
  });

  it("REQ-LIST-013 sair com alteração não salva pergunta antes (fechar a aba)", async () => {
    const { user } = setup();
    await user.type(within(section(copy.sections.home)).getByRole("textbox", { name: copy.home.title }), "!");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("REQ-LIST-015 pausar pede confirmação neutra; pausado mostra o selo e 'Reabrir'", async () => {
    server.use(
      http.post(`*/api/listings/${ID}/deactivation`, () => HttpResponse.json(apiOk(listingDto({ isActive: false })))),
      http.delete(`*/api/listings/${ID}/deactivation`, () => HttpResponse.json(apiOk(listingDto({ isActive: true })))),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: copy.editor.pause }));
    const dialog = await screen.findByRole("dialog", { name: copy.editor.pauseTitle });
    expect(dialog).toHaveAccessibleDescription(copy.editor.pauseMessage);
    await user.click(within(dialog).getByRole("button", { name: copy.editor.pauseConfirm }));

    expect(await screen.findByText(copy.editor.pausedNotice)).toBeInTheDocument();
    expect(screen.getByText(copy.editor.paused)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.editor.reopen }));
    expect(await screen.findByText(copy.editor.active)).toBeInTheDocument();
  });

  it("REQ-LIST-017 o dono vê o endereço completo do cantinho", async () => {
    const { user } = setup();
    await user.click(
      within(screen.getByRole("navigation", { name: copy.editor.sectionsLabel })).getByRole("button", {
        name: new RegExp(copy.sections.address),
      }),
    );
    expect(within(section(copy.sections.address)).getByRole("textbox", { name: "Rua" })).toHaveValue("Avenida Brasil");
  });

  it("troca de aba livremente e preserva rascunho ao salvar outra seção", async () => {
    let body: unknown;
    server.use(
      http.patch(`*/api/listings/${ID}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiOk(listingDto({ nightlyRate: 75 })));
      }),
    );
    const { user } = setup();
    const title = within(section(copy.sections.home)).getByRole("textbox", { name: copy.home.title });
    await user.clear(title);
    await user.type(title, "Meu rascunho");
    const nav = screen.getByRole("navigation", { name: copy.editor.sectionsLabel });
    await user.click(within(nav).getByRole("button", { name: new RegExp(copy.sections.rate) }));
    expect(screen.queryByRole("heading", { name: copy.sections.home })).not.toBeInTheDocument();
    const rate = section(copy.sections.rate);
    await user.clear(within(rate).getByRole("textbox", { name: copy.rate.label }));
    await user.type(within(rate).getByRole("textbox", { name: copy.rate.label }), "75,00");
    await user.click(within(rate).getByRole("button", { name: copy.save(copy.sections.rate) }));
    await within(rate).findByText(copy.saved);
    expect(body).toEqual({ nightlyRate: 75 });
    await user.click(within(nav).getByRole("button", { name: new RegExp(copy.sections.home) }));
    expect(within(section(copy.sections.home)).getByRole("textbox", { name: copy.home.title })).toHaveValue(
      "Meu rascunho",
    );
    expect(window.location.hash).toBe("#secao-home");
    expect(within(nav).getByRole("button", { name: /Sua casa.*Alterações não salvas/ })).toBeInTheDocument();
  });

  it("o link antigo de fotos abre diretamente a aba de fotos", () => {
    window.history.replaceState(null, "", "#secao-photos");
    setup();
    expect(screen.getByRole("heading", { name: copy.photos.heading })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.sections.home })).not.toBeInTheDocument();
  });
});
