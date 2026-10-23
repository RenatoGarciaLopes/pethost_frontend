import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { pickCalendarDays } from "@/test/calendar";
import { BOOKING_ID, bookingDto, PIPOCA_ID, THOR_ID } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import type { PickablePet } from "./PetPickCards";
import { RequestStayForm, type RequestStayFormProps } from "./RequestStayForm";

const copy = bookingCopy.request;
const LISTING_ID = "0199e0a0-0000-7000-8000-0000000000c1";
const NOW = new Date("2026-12-10T15:00:00Z");
const MEL_ID = "0199f0a0-0000-7000-8000-0000000000e3";

const pets: PickablePet[] = [
  { id: PIPOCA_ID, name: "Pipoca", species: "dog", size: "small", coverUrl: null, fit: { fits: true } },
  { id: THOR_ID, name: "Thor", species: "dog", size: "medium", coverUrl: null, fit: { fits: true } },
  { id: MEL_ID, name: "Mel", species: "cat", size: null, coverUrl: null, fit: { fits: false, reason: "species" } },
];

/** A conta simples do total, como o `stayTotal` da página: diária × noites × pets. */
const totalOf: RequestStayFormProps["totalOf"] = (checkIn, checkOut, count) => {
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
  if (!checkIn || !checkOut || count < 1 || !(nights > 0)) return null;
  return `R$ ${(60.5 * nights * count).toFixed(2).replace(".", ",")}`;
};

function setup(props: Partial<RequestStayFormProps> = {}) {
  const queryClient = createTestQueryClient();
  const listKey = bookingQueries.mine("account-1", { statuses: ["requested"] }).queryKey;
  queryClient.setQueryData(listKey, { items: [], page: 1, totalCount: 0, totalPages: 1 });
  const view = renderWithProviders(
    <RequestStayForm
      accountId="account-1"
      listing={{
        id: LISTING_ID,
        title: "Casa da Cida",
        neighborhood: "Zona 01",
        city: "Maringá",
        coverUrl: null,
        nightlyRate: 60.5,
        hostName: "Aparecida Souza",
      }}
      pets={pets}
      today="2026-12-10"
      initial={{ checkIn: "2026-12-20", checkOut: "2026-12-25", petIds: [PIPOCA_ID, THOR_ID] }}
      totalOf={totalOf}
      now={NOW}
      {...props}
    />,
    { theme: quintalTheme, queryClient },
  );
  return { ...view, queryClient, listKey };
}

/** POST /bookings com a resposta dada; devolve os corpos recebidos. */
function serve(response: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    http.post("*/api/bookings", async ({ request }) => {
      bodies.push(await request.json());
      return response();
    }),
  );
  return bodies;
}

describe("RequestStayForm", { timeout: 15000 }, () => {
  it("REQ-REQST-002 REQ-REQST-003 datas e pets da URL, cada pet com Combina ou o motivo; resumo com a conta", () => {
    setup();
    expect(screen.getByLabelText("Chegada e saída")).toHaveValue("20 a 25 dez · 5 noites");
    const who = screen.getByRole("group", { name: copy.pets });
    expect(within(who).getByRole("checkbox", { name: /Pipoca/ })).toBeChecked();
    expect(within(who).getByRole("checkbox", { name: /Thor/ })).toBeChecked();
    const mel = within(who).getByRole("checkbox", { name: /Mel/ });
    expect(mel).toBeDisabled();
    expect(within(who).getByText("Esse cantinho não recebe gato")).toBeInTheDocument();
    expect(within(who).getAllByText("Combina")).toHaveLength(2);

    const summary = screen.getByRole("region", { name: copy.summary });
    expect(summary).toHaveTextContent("Casa da Cida");
    expect(summary).toHaveTextContent("Zona 01, Maringá");
    expect(summary).toHaveTextContent("20 a 25 de dez. · 5 noites");
    expect(summary).toHaveTextContent("Pipoca, Thor");
    expect(summary.textContent).toMatch(/R\$\s60,50 × 5 noites × 2 pets = R\$ 605,00/);
  });

  it("REQ-REQST-002 trocar as datas pelo calendário refaz o resumo e o total", async () => {
    const { user } = setup();
    await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-12-21", "2026-12-23");
    expect(screen.getByLabelText("Chegada e saída")).toHaveValue("21 a 23 dez · 2 noites");
    const summary = screen.getByRole("region", { name: copy.summary });
    expect(summary).toHaveTextContent("21 a 23 de dez. · 2 noites");
    expect(summary.textContent).toMatch(/R\$\s60,50 × 2 noites × 2 pets = R\$ 242,00/);
  });

  it("REQ-REQST-002 pet que não combina vindo da URL não fica marcado; mudar pets refaz a conta", async () => {
    const { user } = setup({ initial: { checkIn: "2026-12-20", checkOut: "2026-12-21", petIds: [MEL_ID, PIPOCA_ID] } });
    expect(screen.getByRole("checkbox", { name: /Mel/ })).not.toBeChecked();
    const summary = screen.getByRole("region", { name: copy.summary });
    expect(summary.textContent).toMatch(/× 1 noite × 1 pet = R\$ 60,50/);
    await user.click(screen.getByRole("checkbox", { name: /Thor/ }));
    expect(summary.textContent).toMatch(/× 1 noite × 2 pets = R\$ 121,00/);
  });

  it("REQ-REQST-004 checklist só na tela e o aviso de que o pedido não segura a vaga", async () => {
    const bodies = serve(() => HttpResponse.json(apiOk(bookingDto()), { status: 201 }));
    const { user } = setup();
    const checklist = screen.getByRole("group", { name: copy.checklist });
    expect(within(checklist).getByRole("checkbox", { name: copy.food })).not.toBeChecked();
    await user.click(within(checklist).getByRole("checkbox", { name: copy.meds }));
    expect(
      screen.getByText("O pedido não segura a vaga: Aparecida Souza tem até 24 horas pra responder."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.submit }));
    await screen.findByRole("heading", { name: copy.sent });
    expect(bodies).toEqual([
      { listingId: LISTING_ID, petIds: [PIPOCA_ID, THOR_ID], checkIn: "2026-12-20", checkOut: "2026-12-25" },
    ]);
  });

  it("REQ-REQST-005 REQ-REQST-006 REQ-REQST-009 envia uma vez só, mostra Pedido enviado com o prazo e invalida as estadias", async () => {
    const bodies = serve(() => HttpResponse.json(apiOk(bookingDto()), { status: 201 }));
    const { user, queryClient, listKey } = setup();
    const submit = screen.getByRole("button", { name: copy.submit });
    await user.dblClick(submit);
    const heading = await screen.findByRole("heading", { name: copy.sent });
    expect(heading).toHaveFocus();
    expect(bodies).toHaveLength(1);
    expect(screen.getByText("Aparecida Souza responde até amanhã às 9h.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.seeStays })).toHaveAttribute("href", "/owner/bookings");
    expect(screen.getByRole("link", { name: copy.backToSearch })).toHaveAttribute("href", "/");
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(bookingQueries.detail("account-1", BOOKING_ID).queryKey)).toBeDefined();
  });

  it("REQ-REQST-002 sem pet marcado e com datas fora da regra, o erro fica no campo e nada é enviado", async () => {
    const bodies = serve(() => HttpResponse.json(apiOk(bookingDto())));
    const { user } = setup({ initial: { checkIn: "2026-12-20", checkOut: "2026-12-20", petIds: [] } });
    await user.click(screen.getByRole("button", { name: copy.submit }));
    expect(await screen.findByText(copy.petsMin)).toBeInTheDocument();
    expect(screen.getByLabelText("Chegada e saída")).toHaveAccessibleDescription(
      "A saída precisa ser depois da chegada.",
    );
    expect(bodies).toHaveLength(0);
  });

  it("REQ-REQST-007 400 da API volta ao campo", async () => {
    serve(() =>
      HttpResponse.json(
        apiFail("VALIDATION_ERROR", "VALIDATION_ERROR", [{ field: "checkIn", messages: ["A chegada já passou."] }]),
        { status: 400 },
      ),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: copy.submit }));
    expect(await screen.findByText("A chegada já passou.")).toBeInTheDocument();
    expect(screen.getByLabelText("Chegada e saída")).toHaveAccessibleDescription("A chegada já passou.");
  });

  it("REQ-REQST-007 regra da API vira frase no topo com o dado: a noite sem vaga", async () => {
    serve(() => HttpResponse.json(apiFail("BOOKING_CAPACITY_EXCEEDED", "No room on 2026-12-22."), { status: 422 }));
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: copy.submit }));
    expect(
      await screen.findByText("Não tem vaga pra todos na noite de 22/12. Tenta outras datas ou menos pets."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.submit })).toBeEnabled();
  });

  it("REQ-REQST-008 cantinho que saiu do ar: a frase e Voltar pra busca", async () => {
    serve(() => HttpResponse.json(apiFail("BOOKING_LISTING_NOT_FOUND"), { status: 404 }));
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: copy.submit }));
    expect(await screen.findByText("Esse cantinho não está recebendo pedidos agora.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.backToSearch })).toHaveAttribute("href", "/");
  });

  it("REQ-REQST-002 sem pets na lista, o caminho para apresentar um", () => {
    setup({ pets: [] });
    expect(screen.getByText(copy.noPets)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.addPet })).toHaveAttribute("href", "/pets/new");
  });
});
