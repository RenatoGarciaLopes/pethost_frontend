import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { useFlashMessageOnce } from "@/shared/hooks/useFlashMessage";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { petDto } from "@/test/fixtures/pets";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { petDtoSchema } from "../../api/contracts";
import { petQueries } from "../../api/queries";
import { toPetDetail } from "../../api/toPetDetail";
import { PetProfile } from "./PetProfile";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const ACCOUNT = "account-1";
const THOR = petDto().id;

function FlashProbe() {
  const message = useFlashMessageOnce();
  return <p>aviso: {message ?? "nenhum"}</p>;
}

function setup(overrides: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(
    petQueries.detail(ACCOUNT, THOR).queryKey,
    toPetDetail(
      petDtoSchema.parse(
        petDto({ vetContact: "Dra. Ana 11 99999-0000", feedingNotes: "Ração 2× ao dia", ...overrides }),
      ),
    ),
  );
  return renderWithProviders(<PetProfile accountId={ACCOUNT} petId={THOR} />, { theme: quintalTheme, queryClient });
}

beforeEach(() => push.mockReset());

it("REQ-PEDIT-001 carteirinha completa com os blocos, editar e tirar da lista", async () => {
  setup();

  const card = await screen.findByRole("article", { name: "Carteirinha de Thor" });
  expect(screen.getByRole("heading", { level: 1, name: "Ficha de Thor" })).toBeInTheDocument();
  for (const block of ["Saúde", "Rotina e manias", "Convivência"])
    expect(within(card).getByRole("heading", { name: block })).toBeInTheDocument();
  expect(within(card).getByText("Dra. Ana 11 99999-0000")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Editar ficha" })).toHaveAttribute("href", `/pets/${THOR}/edit`);
  expect(screen.getByRole("link", { name: "Meus pets" })).toHaveAttribute("href", "/pets");
  expect(screen.getByRole("button", { name: "Tirar da lista" })).toBeInTheDocument();
  expect(screen.queryByText("Fora da lista")).not.toBeInTheDocument();
});

it("REQ-PEDIT-011 REQ-PEDIT-012 confirma sem alarde, volta para a lista e deixa o aviso para ela", async () => {
  server.use(
    http.post("*/api/pets/:id/deactivation", () =>
      HttpResponse.json(apiOk(petDto({ isActive: false, deactivatedAt: "2026-10-14T12:00:00Z" }))),
    ),
  );
  const { user, rerender } = setup();

  await user.click(await screen.findByRole("button", { name: "Tirar da lista" }));
  const dialog = await screen.findByRole("dialog", { name: "Tirar Thor da lista?" });
  expect(
    within(dialog).getByText("A ficha de Thor sai da sua lista. As estadias antigas continuam no histórico."),
  ).toBeInTheDocument();
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Deixar como está" })).toHaveFocus());

  await user.click(within(dialog).getByRole("button", { name: "Tirar da lista" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/pets"));

  rerender(<FlashProbe />);
  expect(screen.getByText("aviso: A ficha de Thor saiu da lista.")).toBeInTheDocument();
});

it("REQ-PEDIT-011 'Deixar como está' fecha sem chamar a API", async () => {
  const { user } = setup();
  await user.click(await screen.findByRole("button", { name: "Tirar da lista" }));
  await user.click(screen.getByRole("button", { name: "Deixar como está" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(push).not.toHaveBeenCalled();
});

it("REQ-PEDIT-003 REQ-PEDIT-013 pet fora da lista: selo neutro, editar continua e voltar com microchip repetido avisa", async () => {
  server.use(
    http.delete("*/api/pets/:id/deactivation", () =>
      HttpResponse.json(apiFail("PET_MICROCHIP_ALREADY_REGISTERED"), { status: 409 }),
    ),
  );
  const { user } = setup({ isActive: false, deactivatedAt: "2026-10-01T12:00:00Z" });

  expect(await screen.findByText("Fora da lista")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Editar ficha" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Tirar da lista" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Voltar pra lista" }));
  expect(await screen.findByText(/Esse microchip já está em outro pet/)).toBeInTheDocument();
  expect(screen.getByText("Fora da lista")).toBeInTheDocument();
});

it("REQ-PEDIT-003 voltar pra lista tira o selo", async () => {
  server.use(http.delete("*/api/pets/:id/deactivation", () => HttpResponse.json(apiOk(petDto()))));
  const { user } = setup({ isActive: false, deactivatedAt: "2026-10-01T12:00:00Z" });

  await user.click(await screen.findByRole("button", { name: "Voltar pra lista" }));
  await waitFor(() => expect(screen.queryByText("Fora da lista")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Tirar da lista" })).toBeInTheDocument();
});

it("REQ-PEDIT-001 sem foto oferece pôr uma foto direto na seção de fotos", async () => {
  setup({ photos: [] });
  expect(await screen.findByRole("link", { name: "Pôr uma foto" })).toHaveAttribute("href", `/pets/${THOR}/edit#fotos`);
});
