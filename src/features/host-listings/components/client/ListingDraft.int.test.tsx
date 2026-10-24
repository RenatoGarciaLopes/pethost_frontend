import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { listingDraftKey } from "../../lib/listingDraft";
import { listingCopy as copy } from "../../lib/listingCopy";
import type { HostListingProfile } from "../../types";
import type { ListingFormValues } from "../../schemas/listingSchema";
import { ListingDraft } from "./ListingDraft";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const ACCOUNT = "account-1";
const profile: HostListingProfile = {
  kind: "person",
  firstName: "Aparecida",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
  payoutsEnabled: true,
  stripeStatus: "enabled",
};

/** Um cantinho completo no formato do formulário (todas as seções respondidas). */
const complete: ListingFormValues = {
  homeType: "house",
  hasYard: true,
  title: "Casa da Aparecida",
  description: "Casa térrea com quintal.",
  hasDogs: false,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["rabbit"],
  acceptsSmall: false,
  acceptsMedium: false,
  acceptsLarge: false,
  capacity: 2,
  address: profile.address!,
  houseRules: "",
  availableWeekdays: ["monday"],
  nightlyRate: "60,00",
};
const ALL = ["home", "household", "guests", "address", "rules", "weekdays", "rate"] as const;

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.useRealTimers());

function seedDraft(values: ListingFormValues, done: readonly string[]) {
  sessionStorage.setItem(listingDraftKey(ACCOUNT), JSON.stringify({ values, done }));
}

function renderDraft() {
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
  return renderWithProviders(<ListingDraft accountId={ACCOUNT} profile={profile} />, { theme: quintalTheme });
}

// Jornadas com formulário inteiro: folga para a máquina compartilhada.
describe("ListingDraft", { timeout: 20000 }, () => {
  it("REQ-LIST-003 rascunho novo: as 7 seções, 'Faltam 7 coisas' e abrir travado", async () => {
    renderDraft();
    expect(await screen.findByText("Faltam 7 coisas pro seu cantinho abrir")).toBeInTheDocument();
    for (const title of Object.values(copy.sections))
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.draft.open })).toBeDisabled();
  });

  it("REQ-LIST-003 REQ-LIST-004 salvar uma seção marca pronta e guarda na sessão", async () => {
    const { user } = renderDraft();
    const rules = screen.getByRole("region", { name: copy.sections.rules });
    await user.click(within(rules).getByRole("button", { name: copy.save(copy.sections.rules) }));
    expect(within(rules).getByRole("status")).toHaveTextContent(copy.sectionSaved);
    expect(screen.getByText("Faltam 6 coisas pro seu cantinho abrir")).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem(listingDraftKey(ACCOUNT)) ?? "{}").done).toEqual(["rules"]),
    );
  });

  it("REQ-LIST-005 seção com erro não fica pronta e diz o que falta", async () => {
    const { user } = renderDraft();
    const home = screen.getByRole("region", { name: copy.sections.home });
    await user.click(within(home).getByRole("button", { name: copy.save(copy.sections.home) }));
    expect(await within(home).findByText(copy.errors.homeType)).toBeInTheDocument();
    expect(within(home).getByText(copy.errors.title)).toBeInTheDocument();
    expect(screen.getByText("Faltam 7 coisas pro seu cantinho abrir")).toBeInTheDocument();
  });

  it("REQ-LIST-004 rascunho restaurado: aviso e 'Começar de novo' limpa", async () => {
    seedDraft(complete, ["home"]);
    const { user } = renderDraft();
    expect(await screen.findByText(copy.draft.restored)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: copy.home.title })).toHaveValue("Casa da Aparecida");
    await user.click(screen.getByRole("button", { name: copy.draft.restart }));
    expect(screen.getByRole("textbox", { name: copy.home.title })).toHaveValue("");
    expect(screen.queryByText(copy.draft.restored)).not.toBeInTheDocument();
    expect(sessionStorage.getItem(listingDraftKey(ACCOUNT))).toBeNull();
  });

  it("REQ-LIST-008 pessoa física começa com o endereço da conta", async () => {
    renderDraft();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Rua" })).toHaveValue("Avenida Brasil"));
    expect(screen.getByText(copy.address.suggested)).toBeInTheDocument();
  });

  it("REQ-LIST-009 a simulação líquida acompanha a diária", async () => {
    const { user } = renderDraft();
    const rate = screen.getByRole("region", { name: copy.sections.rate });
    await user.type(within(rate).getByRole("textbox", { name: copy.rate.label }), "60");
    expect(within(rate).getByText(/Com 2 pets por 10 noites no mês, você recebe R\$\s1\.080,00/)).toBeInTheDocument();
  });

  it("REQ-LIST-011 tudo pronto: um POST só, e o cantinho aberto com o próximo passo", async () => {
    seedDraft(complete, ALL);
    let posts = 0;
    let body: unknown;
    server.use(
      http.post("*/api/listings", async ({ request }) => {
        posts += 1;
        body = await request.json();
        return HttpResponse.json(apiOk(listingDto()), { status: 201 });
      }),
    );
    const { user } = renderDraft();
    expect(await screen.findByText(copy.draft.allReady)).toBeInTheDocument();
    const open = screen.getByRole("button", { name: copy.draft.open });
    await user.dblClick(open);

    expect(await screen.findByRole("heading", { name: copy.opened.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.opened.photos })).toHaveAttribute(
      "href",
      `/host/listings/${listingDto().id}#secao-photos`,
    );
    expect(posts).toBe(1);
    expect(body).toMatchObject({ title: "Casa da Aparecida", nightlyRate: 60, homeType: "house" });
    expect(sessionStorage.getItem(listingDraftKey(ACCOUNT))).toBeNull();
  });

  it("REQ-LIST-012 erro de campo volta à seção: deixa de estar pronta, mostra no campo e recebe o foco", async () => {
    seedDraft(complete, ALL);
    server.use(
      http.post("*/api/listings", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "x", [
            {
              field: "address.zipCode",
              messages: ["CEP não encontrado."],
              errors: [{ code: "LISTING_ZIP_CODE_INVALID", params: { digits: 8 } }],
            },
          ]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderDraft();
    await user.click(await screen.findByRole("button", { name: copy.draft.open }));

    const address = screen.getByRole("region", { name: copy.sections.address });
    await waitFor(() => expect(within(address).getByRole("heading", { level: 2 })).toHaveFocus());
    expect(within(address).getByRole("textbox", { name: "CEP" })).toHaveAccessibleDescription(
      expect.stringContaining("O CEP precisa ter 8 dígitos."),
    );
    expect(screen.getByText("Falta 1 coisa pro seu cantinho abrir")).toBeInTheDocument();
  });

  it("REQ-LIST-012 mapa fora do ar mantém o rascunho e avisa", async () => {
    seedDraft(complete, ALL);
    server.use(
      http.post("*/api/listings", () => HttpResponse.json(apiFail("LISTING_GEOCODER_UNAVAILABLE"), { status: 503 })),
    );
    const { user } = renderDraft();
    await user.click(await screen.findByRole("button", { name: copy.draft.open }));
    expect(
      await screen.findByText("Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos."),
    ).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(listingDraftKey(ACCOUNT)) ?? "{}").done).toHaveLength(7);
  });

  it("REQ-LIST-006 com cachorro, o atalho leva aos pets da casa", async () => {
    seedDraft({ ...complete, hasDogs: true }, []);
    renderDraft();
    expect(await screen.findByRole("link", { name: copy.household.introducePets })).toHaveAttribute("href", "/pets");
  });
});
