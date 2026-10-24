import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { petDtoSchema } from "../../api/contracts";
import { petQueries } from "../../api/queries";
import { toPetDetail } from "../../api/toPetDetail";
import { PetEditor } from "./PetEditor";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Seis seções do MUI montadas por teste: com a suíte em paralelo e a cobertura instrumentada do CI, 5 s não bastam.
vi.setConfig({ testTimeout: 45_000 });

const ACCOUNT = "account-1";
const THOR = petDto().id;

function setup(overrides: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(
    petQueries.detail(ACCOUNT, THOR).queryKey,
    toPetDetail(petDtoSchema.parse(petDto(overrides))),
  );
  return renderWithProviders(<PetEditor accountId={ACCOUNT} petId={THOR} />, { theme: quintalTheme, queryClient });
}

/** Captura o corpo do PATCH e responde com o pet já alterado. */
function acceptPatch(changes: Record<string, unknown> = {}) {
  const bodies: unknown[] = [];
  server.use(
    http.patch("*/api/pets/:id", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      return HttpResponse.json(apiOk(petDto({ ...body, ...changes })));
    }),
    http.get("*/api/pets/me", () => HttpResponse.json(apiOk({ keeper: null, pets: [] }))),
  );
  return bodies;
}

const section = (name: string) => screen.getByRole("region", { name });

beforeEach(() => push.mockReset());

it("REQ-PEDIT-004 REQ-PEDIT-005 REQ-PEDIT-014 salva só o que mudou na seção e atualiza a carteirinha", async () => {
  const bodies = acceptPatch();
  const { user, queryClient } = setup();

  expect(screen.getByRole("heading", { level: 1, name: "Editar a ficha de Thor" })).toBeInTheDocument();
  const health = section("Saúde");
  await user.type(within(health).getByLabelText("Veterinário (nome e telefone)"), "Dra. Ana");
  await user.click(within(health).getByRole("button", { name: "Salvar Saúde" }));

  expect(await within(section("Saúde")).findByText("Salvo.")).toBeInTheDocument();
  expect(bodies).toEqual([{ vetContact: "Dra. Ana" }]);
  // O formulário remontou com os valores salvos; o foco volta ao "Salvar" da seção.
  expect(within(section("Saúde")).getByRole("button", { name: "Salvar Saúde" })).toHaveFocus();
  expect(queryClient.getQueryData(petQueries.detail(ACCOUNT, THOR).queryKey)).toMatchObject({
    values: { vetContact: "Dra. Ana" },
  });
  expect(within(screen.getByRole("article", { name: "Carteirinha de Thor" })).getByText("Dra. Ana")).toBeVisible();
});

it("REQ-PEDIT-005 sem mudança não chama a API", async () => {
  // MSW estrito: um PATCH sem handler derrubaria o teste.
  const { user } = setup();
  const routine = section("Rotina e manias");
  await user.click(within(routine).getByRole("button", { name: "Salvar Rotina e manias" }));
  expect(await within(section("Rotina e manias")).findByText("Nada mudou por aqui.")).toBeInTheDocument();
});

it("REQ-PEDIT-005 texto opcional esvaziado vai como vazio para limpar", async () => {
  const bodies = acceptPatch({ feedingNotes: null });
  const { user } = setup({ feedingNotes: "Ração 2× ao dia" });
  const routine = section("Rotina e manias");
  await user.clear(within(routine).getByLabelText("Alimentação"));
  await user.click(within(routine).getByRole("button", { name: "Salvar Rotina e manias" }));
  await within(section("Rotina e manias")).findByText("Salvo.");
  expect(bodies).toEqual([{ feedingNotes: "" }]);
});

it("REQ-PEDIT-006 o peso troca, mas não fica em branco", async () => {
  const { user } = setup({ weightKg: 12.5 });
  const body = section("Corpo");
  const weight = within(body).getByLabelText("Peso aproximado (kg)");
  expect(within(body).getByText("Dá pra trocar o peso, mas não deixar em branco.")).toBeInTheDocument();
  await user.clear(weight);
  await user.click(within(body).getByRole("button", { name: "Salvar Corpo" }));
  await waitFor(() => expect(weight).toHaveAttribute("aria-invalid", "true"));
});

it("REQ-PEDIT-007 virar coelho avisa que o porte sai; virar cachorro pede o porte na mesma seção", async () => {
  const bodies = acceptPatch();
  const { user } = setup({ species: "cat", size: null });
  const species = section("Bicho");

  await user.click(within(species).getByRole("radio", { name: "Cachorro" }));
  expect(within(species).getByRole("radiogroup", { name: "Porte" })).toBeInTheDocument();
  await user.click(within(species).getByRole("button", { name: "Salvar Bicho" }));
  expect(await within(species).findByText("Escolhe o porte do cachorro.")).toBeInTheDocument();
  expect(bodies).toEqual([]);

  await user.click(within(species).getByRole("radio", { name: /Grande/ }));
  await user.click(within(species).getByRole("button", { name: "Salvar Bicho" }));
  await within(section("Bicho")).findByText("Salvo.");
  expect(bodies).toEqual([{ species: "dog", size: "large" }]);
});

it("REQ-PEDIT-007 a troca para bicho sem porte avisa antes de salvar", async () => {
  const { user } = setup();
  const species = section("Bicho");
  await user.click(within(species).getByRole("radio", { name: "Coelho" }));
  expect(await within(species).findByText("Mudando pra Coelho, o porte sai da ficha.")).toBeInTheDocument();
});

it("REQ-PEDIT-015 erro da API no campo da seção volta ao campo; de outra seção vira aviso com link", async () => {
  server.use(
    http.patch("*/api/pets/:id", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "invalid", [
          {
            field: "vetContact",
            messages: ["Confere esse contato."],
            errors: [{ code: "PET_VET_CONTACT_TOO_LONG", params: { max: 160 } }],
          },
          {
            field: "name",
            messages: ["Confere esse nome."],
            errors: [{ code: "PET_NAME_TOO_LONG", params: { max: 60 } }],
          },
        ]),
        { status: 400 },
      ),
    ),
  );
  const { user } = setup();
  const health = section("Saúde");
  await user.type(within(health).getByLabelText("Veterinário (nome e telefone)"), "x");
  await user.click(within(health).getByRole("button", { name: "Salvar Saúde" }));

  expect(
    await within(section("Saúde")).findByText("O contato do veterinário aceita até 160 caracteres."),
  ).toBeInTheDocument();
  // O que a pessoa digitou continua no campo depois da recusa.
  expect(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)")).toHaveValue("x");
  expect(within(section("Saúde")).getByRole("link", { name: "Nome e sexo" })).toHaveAttribute("href", "#nome");
});

it("REQ-PEDIT-015 microchip de outro pet aparece no campo", async () => {
  server.use(
    http.patch("*/api/pets/:id", () => HttpResponse.json(apiFail("PET_MICROCHIP_ALREADY_REGISTERED"), { status: 409 })),
  );
  const { user } = setup();
  await user.type(within(section("Saúde")).getByLabelText("Microchip"), "123456789012345");
  await user.click(within(section("Saúde")).getByRole("button", { name: "Salvar Saúde" }));
  expect(await within(section("Saúde")).findByText(/Esse microchip já está em outro pet/)).toBeInTheDocument();
});

it("REQ-PEDIT-017 sair por um link com seção alterada pergunta antes", async () => {
  const { user } = setup();
  await user.type(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)"), "Dra.");
  await user.click(screen.getByRole("link", { name: "Ficha de Thor" }));

  const dialog = await screen.findByRole("dialog", { name: "Sair sem salvar?" });
  await user.click(within(dialog).getByRole("button", { name: "Continuar editando" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(push).not.toHaveBeenCalled();
  expect(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)")).toHaveValue("Dra.");
});

it("REQ-PEDIT-008 as fotos salvas aparecem nas vagas, com trocar e tirar", async () => {
  setup();
  const photos = screen.getByRole("group", { name: "Fotos de Thor" });
  expect(within(photos).getByRole("img", { name: "Foto 1" })).toHaveAttribute(
    "src",
    "https://cdn.pethost.test/thor.jpg",
  );
  expect(within(photos).getByLabelText("Trocar foto 1")).toBeInTheDocument();
  expect(within(photos).getByRole("button", { name: "Tirar foto 1" })).toBeInTheDocument();
  expect(screen.getByText("A primeira é a capa. Pra trocar a capa, tira a primeira e põe outra.")).toBeInTheDocument();
});

it("REQ-PEDIT-008 REQ-PEDIT-014 tirar a foto atualiza as vagas pela resposta da API", async () => {
  server.use(
    http.delete("*/api/pets/:id/photos/:photoId", () => HttpResponse.json(apiOk(petDto({ photos: [] })))),
    http.get("*/api/pets/me", () => HttpResponse.json(apiOk({ keeper: null, pets: [] }))),
  );
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Tirar foto 1" }));
  await waitFor(() => expect(screen.queryByRole("img", { name: "Foto 1" })).not.toBeInTheDocument());
});

it("REQ-PEDIT-015 erro de um campo que nenhuma seção edita aparece no aviso da seção", async () => {
  server.use(
    http.patch("*/api/pets/:id", () =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "invalid", [
          {
            field: "ownerId",
            messages: ["Essa ficha não pode mudar agora."],
            errors: [{ code: "PET_KEEPER_ID_REQUIRED" }],
          },
        ]),
        { status: 400 },
      ),
    ),
  );
  const { user } = setup();
  await user.type(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)"), "x");
  await user.click(within(section("Saúde")).getByRole("button", { name: "Salvar Saúde" }));
  expect(await within(section("Saúde")).findByText("Falta o responsável.")).toBeInTheDocument();
});

it("REQ-PEDIT-004 salvar a espécie não apaga o que está sendo digitado em outra seção", async () => {
  acceptPatch();
  const { user } = setup();
  await user.type(within(section("Rotina e manias")).getByLabelText("Alimentação"), "Ração úmida");
  await user.click(within(section("Bicho")).getByRole("radio", { name: "Gato" }));
  await user.click(within(section("Bicho")).getByRole("button", { name: "Salvar Bicho" }));
  await within(section("Bicho")).findByText("Salvo.");
  expect(within(section("Rotina e manias")).getByLabelText("Alimentação")).toHaveValue("Ração úmida");
});

it("REQ-PEDIT-004 no celular as seções recolhem e reabrem sem perder o que foi digitado", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  try {
    const { user } = setup();
    const toggle = within(section("Saúde")).getByRole("button", { name: "Saúde" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.type(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)"), "Dra.");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(within(section("Saúde")).getByLabelText("Veterinário (nome e telefone)")).toHaveValue("Dra.");
  } finally {
    vi.unstubAllGlobals();
  }
});
