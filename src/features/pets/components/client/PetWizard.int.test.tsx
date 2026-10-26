import { File as NativeFile } from "node:buffer";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petDto, petProfileValuesFixture } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { petDraftKey } from "../../lib/petDraft";
import { petQueries } from "../../api/queries";
import { PetWizardProvider } from "../../stores/PetWizardProvider";
import { PetWizard } from "./PetWizard";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
beforeAll(() => {
  // APIs de object URL ausentes no jsdom, sem substituir validação/hash/upload.
  URL.createObjectURL = () => "blob:foto";
  URL.revokeObjectURL = () => undefined;
});
beforeEach(async () => {
  sessionStorage.clear();
  // A família File/FormData do fetch nativo evita a mistura com os objetos incompletos do jsdom.
  // Request local apenas converte um corpo vazio, sem chamada HTTP.
  const native = await new Request("http://browser.test", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "",
  }).formData();
  vi.stubGlobal("File", NativeFile);
  vi.stubGlobal("FormData", native.constructor);
});
afterEach(() => vi.unstubAllGlobals());
function setup(step = 7, values = petProfileValuesFixture) {
  sessionStorage.setItem(petDraftKey("test"), JSON.stringify({ step, values }));
  return renderWithProviders(
    <AnnouncerProvider>
      <PetWizardProvider>
        <PetWizard accountId="test" />
      </PetWizardProvider>
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
}
const save = () => screen.getByRole("button", { name: "Salvar a ficha de Mel" });
const photo = (data: string, name: string) => new File([data], name, { type: "image/jpeg" });
async function review(user: ReturnType<typeof renderWithProviders>["user"]) {
  for (let index = 0; index < 5; index++) await user.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("heading", { name: "Confere a ficha" });
}
it("REQ-PNEW-016/020 clique duplo cria uma vez; sucesso invalida cache, apaga rascunho e anuncia", async () => {
  let creates = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post("*/api/pets", async ({ request }) => {
      creates++;
      expect(await request.json()).toEqual(petProfileValuesFixture);
      await pending;
      return HttpResponse.json(apiOk(petDto({ name: "Mel" })));
    }),
  );
  const { user, queryClient } = setup();
  queryClient.setQueryData([...petQueries.all("test"), "mine"], { active: [], inactive: [] });
  await screen.findByRole("heading", { name: "Confere a ficha" });
  await user.dblClick(save());
  await waitFor(() => expect(creates).toBe(1));
  expect(screen.getByRole("button", { name: "Salvando a ficha…" })).toBeDisabled();
  release();
  expect(await screen.findByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Ficha de Mel salva.");
  expect(sessionStorage.getItem(petDraftKey("test"))).toBeNull();
  expect(queryClient.getQueryState([...petQueries.all("test"), "mine"])?.isInvalidated).toBe(true);
  expect(creates).toBe(1);
}, 15_000);
it("REQ-PNEW-017 400 retorna ao passo do campo, foca e permite reenviar", async () => {
  let creates = 0;
  server.use(
    http.post("*/api/pets", () => {
      creates++;
      return creates === 1
        ? HttpResponse.json(
            apiFail("VALIDATION_ERROR", "invalid", [
              { field: "name", messages: ["Confere esse nome."], errors: [{ code: "PET_NAME_REQUIRED" }] },
            ]),
            { status: 400 },
          )
        : HttpResponse.json(apiOk(petDto()));
    }),
  );
  const { user } = setup();
  await screen.findByRole("heading", { name: "Confere a ficha" });
  await user.click(save());
  await waitFor(() => expect(screen.getByText("Falta o nome.")).toBeVisible());
  expect(screen.getByLabelText(/^Nome/)).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.click(save());
  expect(await screen.findByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
  expect(creates).toBe(2);
}, 15_000);
it("REQ-PNEW-010/017 microchip repetido volta à saúde com mensagem no campo", async () => {
  server.use(
    http.post("*/api/pets", () => HttpResponse.json(apiFail("PET_MICROCHIP_ALREADY_REGISTERED"), { status: 409 })),
  );
  const { user } = setup();
  await screen.findByRole("heading", { name: "Confere a ficha" });
  await user.click(save());
  await waitFor(() => expect(screen.getByRole("heading", { name: "Saúde", level: 1 })).toBeVisible());
  expect(screen.getByLabelText("Microchip")).toHaveAccessibleDescription(
    "Esse microchip já está em outro pet. Se é o seu, fala com o suporte.",
  );
  expect(screen.getByLabelText("Microchip")).toHaveFocus();
}, 15_000);
it("REQ-PNEW-018 foto 500 marca a vaga e retry envia apenas a que falhou sem recriar pet", async () => {
  let creates = 0;
  const uploads: string[] = [];
  // uploadDirect retries the confirmation of a 5xx twice, so the second photo fails until the user asks again.
  let failTwo = true;
  server.use(
    http.post("*/api/pets", () => {
      creates++;
      return HttpResponse.json(apiOk(petDto()));
    }),
    http.post(`*/api/pets/${petDto().id}/photos`, async ({ request }) => {
      const raw = await request.text();
      expect(request.headers.get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
      expect(raw).toContain('name="file"');
      const name = /filename="([^"]+)"/.exec(raw)?.[1];
      expect(name).toBeDefined();
      uploads.push(raw.includes("one") ? "one" : raw.includes("two") ? "two" : "unknown");
      return failTwo && uploads.at(-1) === "two"
        ? HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })
        : HttpResponse.json(apiOk(petDto()));
    }),
  );
  const { user } = setup(2);
  await screen.findByRole("heading", { name: "Como seu pet se chama?" });
  await user.upload(screen.getByLabelText("Adicionar foto 1"), photo("one", "boa.jpg"));
  await screen.findByAltText("Prévia da foto 1");
  await user.upload(screen.getByLabelText("Adicionar foto 2"), photo("two", "falha.jpg"));
  await screen.findByAltText("Prévia da foto 2");
  await review(user);
  await user.click(save());
  expect(
    await screen.findByText("A foto não subiu. Tenta de novo ou segue sem, dá pra pôr depois.", {}, { timeout: 5000 }),
  ).toBeVisible();
  expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Deu um problema"))).toBe(true);
  failTwo = false;
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(await screen.findByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
  expect(creates).toBe(1);
  expect(uploads).toEqual(["one", "two", "two", "two", "two"]);
}, 15_000);
it("REQ-PNEW-018 seguir sem foto conclui e mantém o pet criado", async () => {
  let creates = 0;
  let uploads = 0;
  server.use(
    http.post("*/api/pets", () => {
      creates++;
      return HttpResponse.json(apiOk(petDto()));
    }),
    http.post(`*/api/pets/${petDto().id}/photos`, () => {
      uploads++;
      return HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 });
    }),
  );
  const { user } = setup(2);
  await screen.findByRole("heading", { name: "Como seu pet se chama?" });
  await user.upload(screen.getByLabelText("Adicionar foto 1"), photo("one", "falha.jpg"));
  await screen.findByAltText("Prévia da foto 1");
  await review(user);
  await user.click(save());
  await user.click(await screen.findByRole("button", { name: "Seguir sem a foto" }));
  expect(await screen.findByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
  expect(creates).toBe(1);
  // One send plus the two confirmation retries made by uploadDirect; skipping does not send again.
  expect(uploads).toBe(3);
}, 15_000);
it("REQ-PNEW-021 restaura rascunho e começar de novo limpa respostas", async () => {
  const { user } = setup(2);
  expect(await screen.findByText("Continuando a ficha de Mel.")).toBeVisible();
  expect(screen.getByLabelText(/^Nome/)).toHaveValue("Mel");
  await user.click(screen.getByRole("button", { name: "Começar de novo" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Que bicho é o seu?");
  await user.click(screen.getByRole("radio", { name: "Cachorro" }));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  expect(screen.getByLabelText(/^Nome/)).toHaveValue("");
  expect(screen.queryByText("Continuando a ficha de Mel.")).not.toBeInTheDocument();
}, 15_000);
it("REQ-PNEW-007 arquivo repetido em outra vaga é recusado mesmo com nome diferente", async () => {
  const { user } = setup(2);
  await screen.findByRole("heading", { name: "Como seu pet se chama?" });
  await user.upload(screen.getByLabelText("Adicionar foto 1"), photo("same", "a.jpg"));
  await screen.findByAltText("Prévia da foto 1");
  await user.upload(screen.getByLabelText("Adicionar foto 2"), photo("same", "b.jpg"));
  expect(await screen.findByText("Essa foto já está na ficha.")).toBeVisible();
  expect(screen.queryByAltText("Prévia da foto 2")).not.toBeInTheDocument();
}, 15_000);
it("REQ-PNEW-021 começar de novo não recria rascunho vazio depois do debounce", () => {
  vi.useFakeTimers();
  try {
    setup(2);
    fireEvent.click(screen.getByRole("button", { name: "Começar de novo" }));
    act(() => vi.advanceTimersByTime(500));
    expect(sessionStorage.getItem(petDraftKey("test"))).toBeNull();
  } finally {
    vi.useRealTimers();
  }
}, 15_000);
it("REQ-HPETS-004/005 cadastro de anfitrião termina com copy própria e invalida só sua vitrine", async () => {
  server.use(http.post("*/api/pets", () => HttpResponse.json(apiOk(petDto({ name: "Bóris" })))));
  sessionStorage.setItem(
    petDraftKey("host-test"),
    JSON.stringify({ step: 7, values: { ...petProfileValuesFixture, name: "Bóris" } }),
  );
  const { user, queryClient } = renderWithProviders(
    <AnnouncerProvider>
      <PetWizardProvider>
        <PetWizard accountId="host-test" role="host" />
      </PetWizardProvider>
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
  queryClient.setQueryData(petQueries.mine("host-test").queryKey, { active: [], inactive: [], hostId: "host-profile" });
  queryClient.setQueryData(petQueries.house("host-profile").queryKey, []);
  queryClient.setQueryData(petQueries.house("other-profile").queryKey, []);
  await screen.findByRole("heading", { name: "Confere a ficha" });
  await user.click(screen.getByRole("button", { name: "Salvar a ficha de Bóris" }));
  expect(await screen.findByRole("heading", { name: "Prazer, Bóris!" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Apresentar outro pet da casa" })).toBeVisible();
  expect(queryClient.getQueryState(petQueries.house("host-profile").queryKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(petQueries.house("other-profile").queryKey)?.isInvalidated).toBe(false);
});
