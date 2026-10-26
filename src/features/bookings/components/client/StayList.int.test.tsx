import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { bookingDto } from "@/test/fixtures/bookings";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { bookingCopy } from "../../lib/bookingCopy";
import { StayList } from "./StayList";

const copy = bookingCopy.owner;
const id = (n: number) => `0199f0a0-0000-7000-8000-0000000001${String(n).padStart(2, "0")}`;

/** API paginada: 2 por página para testar o "Mostrar mais". */
function serve(items: unknown[]) {
  const requests: string[] = [];
  server.use(
    http.get("*/api/bookings/me", ({ request }) => {
      const url = new URL(request.url);
      requests.push(`${url.searchParams.getAll("status").join(",")}|${url.searchParams.get("page")}`);
      const page = Number(url.searchParams.get("page"));
      const slice = items.slice((page - 1) * 2, page * 2);
      return HttpResponse.json(
        apiOk({ items: slice, page, pageSize: 2, totalCount: items.length, totalPages: Math.ceil(items.length / 2) }),
      );
    }),
  );
  return requests;
}

const renderList = () => renderWithProviders(<StayList accountId="account-1" pageSize={2} />, { theme: quintalTheme });

const closed = { responseDeadline: null };

describe("StayList", { timeout: 15000 }, () => {
  it("REQ-STAYS-002 cada estadia é um card: título que leva ao detalhe, selo, período, noites e total", async () => {
    serve([bookingDto({ ...closed, status: "confirmed" })]);
    renderList();
    const link = await screen.findByRole("link", { name: "Pipoca na casa de Aparecida Souza" });
    expect(link).toHaveAttribute("href", `/owner/bookings/${bookingDto().id}`);
    const card = link.closest("li")!;
    expect(within(card).getByText("Confirmada")).toBeInTheDocument();
    expect(card.textContent).toMatch(/20 a 25 de dez\. · 5 noites · R\$\s300,00/);
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    expect(within(card).getAllByRole("link")).toHaveLength(1);
  });

  it("REQ-STAYS-010 aceita: 'Pagar' com o total leva ao checkout, e a lista vem em ordem de relevância", async () => {
    const requests = serve([
      bookingDto({ ...closed, id: id(1), status: "completed" }),
      bookingDto({
        ...closed,
        id: id(2),
        status: "accepted",
        paymentDeadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      }),
    ]);
    renderList();
    const items = await within(await screen.findByRole("list", { name: copy.listLabel })).findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Aceita · falta pagar");
    expect(items[0]!.textContent).toMatch(/Pague até .* pra garantir a vaga./);
    const pay = within(items[0]!).getByRole("link", { name: /^Pagar R\$\s300,00$/ });
    expect(pay).toHaveAttribute("href", `/owner/bookings/${id(2)}/payment`);
    expect(items[1]).toHaveTextContent("Concluída");
    expect(requests).toEqual(["requested,accepted,confirmed,in_progress,completed,declined,expired,cancelled|1"]);
  });

  it("REQ-STAYS-010 expirada: a frase do que houve e o link 'Buscar outro cantinho' para a busca", async () => {
    serve([bookingDto({ ...closed, status: "expired" })]);
    renderList();
    const card = (await screen.findByRole("link", { name: /^Pipoca na casa/ })).closest("li")!;
    expect(card).toHaveTextContent("Aparecida Souza não respondeu em 24 horas. Nada foi cobrado.");
    expect(within(card).getByRole("link", { name: "Buscar outro cantinho" })).toHaveAttribute("href", "/");
  });

  it("REQ-STAYS-003 'Mostrar mais' traz a próxima página", async () => {
    const requests = serve([1, 2, 3].map((n) => bookingDto({ ...closed, id: id(n), status: "completed" })));
    const { user } = renderList();
    expect(
      await within(await screen.findByRole("list", { name: copy.listLabel })).findAllByRole("listitem"),
    ).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: copy.more }));
    expect(
      await within(await screen.findByRole("list", { name: copy.listLabel })).findAllByRole("listitem"),
    ).toHaveLength(3);
    expect(screen.queryByRole("button", { name: copy.more })).not.toBeInTheDocument();
    expect(requests.map((request) => request.split("|")[1])).toEqual(["1", "2"]);
  });

  it("REQ-STAYS-003 lista vazia com frase própria e o caminho da busca", async () => {
    serve([]);
    renderList();
    expect(await screen.findByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.search })).toHaveAttribute("href", "/");
  });
});
