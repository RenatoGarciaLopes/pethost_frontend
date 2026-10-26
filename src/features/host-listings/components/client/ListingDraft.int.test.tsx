import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { listingDraftKey } from "../../lib/listingDraft";
import { listingCopy as copy } from "../../lib/listingCopy";
import type { ListingStepId } from "../../lib/listingSteps";
import type { HostListingProfile } from "../../types";
import type { ListingFormValues } from "../../schemas/listingSchema";
import { ListingDraft } from "./ListingDraft";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const ACCOUNT = "account-1";
const steps = copy.wizard.steps;
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

/** Um cantinho completo no formato do formulário (todos os passos respondidos). */
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

beforeEach(() => {
  sessionStorage.clear();
  push.mockClear();
});

function seedDraft(draft: Record<string, unknown>) {
  sessionStorage.setItem(listingDraftKey(ACCOUNT), JSON.stringify(draft));
}
const storedDraft = () => JSON.parse(sessionStorage.getItem(listingDraftKey(ACCOUNT)) ?? "null");
const stepHeading = (step: ListingStepId) => screen.findByRole("heading", { level: 1, name: steps[step].title });
const continueButton = () => screen.getByRole("button", { name: /^Continuar: |^Voltar pra revisão$/ });

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
describe("ListingDraft em passos", { timeout: 20000 }, () => {
  it("104 rascunho novo: passo 1 de 9 na trilha, título do passo e o botão diz o que vem", async () => {
    renderDraft();
    expect(await stepHeading("home")).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 9")).toBeInTheDocument();
    const trail = screen.getByRole("navigation", { name: copy.wizard.progressLabel });
    expect(within(trail).getAllByRole("listitem")).toHaveLength(9);
    expect(continueButton()).toHaveAccessibleName("Continuar: nome");
  });

  it("104 REQ-LIST-005 o 'Continuar' valida o passo: não avança, diz o que falta e foca o campo; escolher apaga o erro", async () => {
    const { user } = renderDraft();
    await stepHeading("home");
    await user.click(continueButton());
    expect(await screen.findByText(copy.errors.homeType)).toBeInTheDocument();
    expect(screen.getByText(copy.errors.yesNo)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(steps.home.title);
    expect(screen.getByRole("radio", { name: /^Casa/ })).toHaveFocus();
    await user.click(screen.getByRole("radio", { name: /^Casa/ }));
    await waitFor(() => expect(screen.queryByText(copy.errors.homeType)).not.toBeInTheDocument());
  });

  it("104 avançar e voltar não perde nada; o título recebe o foco a cada troca; o card ao vivo acompanha", async () => {
    const { user } = renderDraft();
    await stepHeading("home");
    await user.click(screen.getByRole("radio", { name: /^Apartamento/ }));
    await user.click(screen.getByRole("radiogroup", { name: copy.home.hasYard }).querySelector("button")!);
    await user.click(continueButton());
    expect(await stepHeading("title")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /Apê da Aparecida/ }));
    expect(screen.getByRole("textbox", { name: copy.home.title })).toHaveValue("Apê da Aparecida");
    const preview = screen.getAllByRole("complementary", { name: copy.preview.heading })[0]!;
    expect(preview).toHaveTextContent("Apê da Aparecida");
    expect(preview).toHaveTextContent("Zona 01 · Maringá");
    expect(preview).not.toHaveTextContent("Avenida Brasil");

    await user.click(screen.getByRole("button", { name: copy.wizard.back }));
    expect(await stepHeading("home")).toHaveFocus();
    expect(screen.getByRole("radio", { name: /^Apartamento/ })).toBeChecked();
    await user.click(continueButton());
    await stepHeading("title");
    expect(screen.getByRole("textbox", { name: copy.home.title })).toHaveValue("Apê da Aparecida");
  });

  it("104 REQ-LIST-004 o rascunho guarda o passo; ao voltar, abre nele com o aviso, e 'Começar de novo' limpa", async () => {
    seedDraft({ values: { ...complete, nightlyRate: "" }, step: "address" });
    const { user } = renderDraft();
    expect(await stepHeading("address")).toBeInTheDocument();
    expect(screen.getByText(copy.draft.restored)).toBeInTheDocument();
    await user.click(continueButton());
    expect(await stepHeading("rules")).toBeInTheDocument();
    await waitFor(() => expect(storedDraft()?.step).toBe("rules"));
    expect(screen.queryByText(copy.draft.restored)).not.toBeInTheDocument();
  });

  it("104 REQ-LIST-004 'Começar de novo' volta ao passo 1 em branco e apaga o rascunho", async () => {
    seedDraft({ values: complete, step: "weekdays" });
    const { user } = renderDraft();
    await stepHeading("weekdays");
    await user.click(screen.getByRole("button", { name: copy.draft.restart }));
    expect(await stepHeading("home")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Casa/ })).not.toBeChecked();
    expect(storedDraft()).toBeNull();
  });

  it("104 rascunho do formato antigo (só 'done') abre no primeiro passo que falta", async () => {
    seedDraft({ values: { ...complete, availableWeekdays: [] }, done: ["home", "household", "guests"] });
    renderDraft();
    expect(await stepHeading("weekdays")).toBeInTheDocument();
    expect(screen.getByText(copy.draft.restored)).toBeInTheDocument();
  });

  it("104 REQ-LIST-007 portes só com cachorro ou gato, e então ao menos um", async () => {
    seedDraft({ values: { ...complete, acceptedSpecies: [] }, step: "guests" });
    const { user } = renderDraft();
    await stepHeading("guests");
    expect(screen.queryByRole("group", { name: copy.guests.sizes })).not.toBeInTheDocument();
    // "Outro bicho" no padrão dos portes: rótulo curto e o "aceito conversar" como descrição.
    expect(screen.getByRole("checkbox", { name: "Outro bicho. aceito conversar" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Cachorro" }));
    await user.click(continueButton());
    const sizes = await screen.findByRole("group", { name: copy.guests.sizes });
    expect(sizes).toHaveAccessibleDescription(copy.errors.sizes);
    expect(sizes).toHaveFocus();
    await user.click(within(sizes).getByRole("checkbox", { name: /^Pequeno/ }));
    await user.click(continueButton());
    expect(await stepHeading("address")).toBeInTheDocument();
  });

  it("104 REQ-LIST-009 a simulação líquida acompanha a diária", async () => {
    seedDraft({ values: { ...complete, nightlyRate: "" }, step: "rate" });
    const { user } = renderDraft();
    await stepHeading("rate");
    await user.type(screen.getByRole("textbox", { name: copy.rate.label }), "60");
    const simulation = screen.getByRole("region", { name: copy.rate.simulationTitle });
    expect(within(simulation).getAllByRole("status")[0]!.textContent).toMatch(
      /Com 2 pets por 10 noites no mês, você recebe R\$\s1\.080,00/,
    );
  });

  it("104 'Editar' na revisão leva ao passo, e o botão volta para a revisão", async () => {
    seedDraft({ values: complete, step: "review" });
    const { user } = renderDraft();
    await stepHeading("review");
    expect(screen.getByRole("region", { name: steps.guests.label })).toHaveTextContent("Coelho · até 2 pets por vez");
    await user.click(screen.getByRole("button", { name: copy.review.editLabel(steps.weekdays.label) }));
    expect(await stepHeading("weekdays")).toHaveFocus();
    await user.click(screen.getByRole("checkbox", { name: "Sexta" }));
    await user.click(screen.getByRole("button", { name: copy.wizard.backToReview }));
    expect(await stepHeading("review")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: steps.weekdays.label })).toHaveTextContent("Seg e Sex");
  });

  it("REQ-LIST-011 abrir: um POST só, e o cantinho aberto com o próximo passo", async () => {
    seedDraft({ values: complete, step: "review" });
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
    await stepHeading("review");
    await user.dblClick(screen.getByRole("button", { name: copy.draft.open }));

    expect(await screen.findByRole("heading", { name: copy.opened.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.opened.photos })).toHaveAttribute(
      "href",
      `/host/listings/${listingDto().id}#secao-photos`,
    );
    expect(posts).toBe(1);
    expect(body).toMatchObject({ title: "Casa da Aparecida", nightlyRate: 60, homeType: "house" });
    expect(storedDraft()).toBeNull();
  });

  it("REQ-LIST-012 erro de campo da API volta ao passo certo, mostra no campo e foca; o botão volta à revisão", async () => {
    seedDraft({ values: complete, step: "review" });
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
    await stepHeading("review");
    await user.click(screen.getByRole("button", { name: copy.draft.open }));

    expect(await stepHeading("address")).toBeInTheDocument();
    const zip = screen.getByRole("textbox", { name: "CEP" });
    await waitFor(() => expect(zip).toHaveFocus());
    expect(zip).toHaveAccessibleDescription(expect.stringContaining("O CEP precisa ter 8 dígitos."));
    expect(continueButton()).toHaveAccessibleName(copy.wizard.backToReview);
  });

  it("REQ-LIST-012 endereço que o mapa não acha volta ao endereço com o aviso", async () => {
    seedDraft({ values: complete, step: "review" });
    server.use(
      http.post("*/api/listings", () => HttpResponse.json(apiFail("LISTING_ADDRESS_NOT_LOCATED"), { status: 422 })),
    );
    const { user } = renderDraft();
    await stepHeading("review");
    await user.click(screen.getByRole("button", { name: copy.draft.open }));
    expect(await stepHeading("address")).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((node) => node.textContent?.includes("mapa"))).toBe(true);
  });

  it("REQ-LIST-012 mapa fora do ar mantém o rascunho e anuncia o aviso", async () => {
    seedDraft({ values: complete, step: "review" });
    server.use(
      http.post("*/api/listings", () => HttpResponse.json(apiFail("LISTING_GEOCODER_UNAVAILABLE"), { status: 503 })),
    );
    const { user } = renderDraft();
    await stepHeading("review");
    await user.click(screen.getByRole("button", { name: copy.draft.open }));
    const notice = await screen.findByText(
      "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos.",
    );
    await waitFor(() => expect(notice.closest("[role=status]")).toHaveFocus());
    expect(storedDraft()?.values.title).toBe("Casa da Aparecida");
  });

  it("REQ-LIST-008 pessoa física começa com o endereço da conta", async () => {
    seedDraft({ values: { ...complete }, step: "address" });
    renderDraft();
    await stepHeading("address");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Rua" })).toHaveValue("Avenida Brasil"));
    expect(screen.getByText(copy.address.suggested)).toBeInTheDocument();
  });

  it("REQ-LIST-006 com cachorro, o atalho leva aos pets da casa", async () => {
    seedDraft({ values: { ...complete, hasDogs: true }, step: "household" });
    renderDraft();
    expect(await screen.findByRole("link", { name: copy.household.introducePets })).toHaveAttribute("href", "/pets");
  });

  it("104 'Voltar' no primeiro passo leva ao painel sem apagar o rascunho", async () => {
    const { user } = renderDraft();
    await stepHeading("home");
    await user.click(screen.getByRole("radio", { name: /^Casa/ }));
    await user.click(screen.getByRole("button", { name: copy.wizard.back }));
    expect(push).toHaveBeenCalledWith("/host");
    await waitFor(() => expect(storedDraft()?.values.homeType).toBe("house"));
  });
});
