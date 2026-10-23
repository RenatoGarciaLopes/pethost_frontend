import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { bookingDto } from "@/test/fixtures/bookings";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { bookingCopy } from "../../lib/bookingCopy";
import { ownerTabOf } from "../../lib/bookingStatus";
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

const renderList = (tab: string) =>
  renderWithProviders(<StayList accountId="account-1" tab={ownerTabOf(tab)} pageSize={2} />, { theme: quintalTheme });

describe("StayList", { timeout: 15000 }, () => {
  it("REQ-STAYS-001 REQ-STAYS-002 abas na URL e cada estadia como link com cantinho, período, pets, total e status", async () => {
    serve([bookingDto({ status: "confirmed" })]);
    renderList("proximas");
    const tabs = screen.getByRole("navigation", { name: copy.tabsLabel });
    expect(within(tabs).getByRole("link", { name: "Próximas" })).toHaveAttribute("aria-current", "page");
    expect(within(tabs).getByRole("link", { name: "Anteriores" })).toHaveAttribute(
      "href",
      "/owner/bookings?aba=anteriores",
    );

    // Sem aria-label: o nome do link é o próprio texto que se vê (comando de voz).
    const item = await screen.findByRole("link", { name: /^Casa da Cida/ });
    expect(item).toHaveAttribute("href", `/owner/bookings/${bookingDto().id}`);
    expect(item).toHaveTextContent("20 a 25 de dez.");
    expect(item).toHaveTextContent("20 a 25 de dez.");
    expect(item).toHaveTextContent("Zona 01, Maringá");
    expect(item).toHaveTextContent("Pipoca");
    expect(item.textContent).toMatch(/R\$\s300,00/);
    expect(item).toHaveTextContent("Confirmada");
  });

  it("REQ-STAYS-003 'Mostrar mais' traz a próxima página da mesma aba", async () => {
    const requests = serve([1, 2, 3].map((n) => bookingDto({ id: id(n), status: "completed" })));
    const { user } = renderList("anteriores");
    expect(
      await within(await screen.findByRole("list", { name: copy.listLabel })).findAllByRole("listitem"),
    ).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: copy.more }));
    expect(
      await within(await screen.findByRole("list", { name: copy.listLabel })).findAllByRole("listitem"),
    ).toHaveLength(3);
    expect(screen.queryByRole("button", { name: copy.more })).not.toBeInTheDocument();
    expect(requests).toEqual(["completed,declined,expired,cancelled|1", "completed,declined,expired,cancelled|2"]);
  });

  it("REQ-STAYS-003 aba vazia com frase própria e o caminho da busca", async () => {
    serve([]);
    renderList("proximas");
    expect(await screen.findByText(copy.empty.proximas!)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.search })).toHaveAttribute("href", "/");
  });
});
