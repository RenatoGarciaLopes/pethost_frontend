import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { bookingDto, bookingPageDto, THOR_ID } from "@/test/fixtures/bookings";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { hostTabOf } from "../../lib/bookingStatus";
import { bookingCopy } from "../../lib/bookingCopy";
import { HostBookingList } from "./HostBookingList";

const copy = bookingCopy.host;
const NOW = new Date("2026-12-10T15:00:00Z"); // 12h em Brasília

/** API de lista: responde pelo status pedido. */
function serveLists(byStatus: Record<string, unknown[]>) {
  const requests: string[] = [];
  server.use(
    http.get("*/api/bookings/me", ({ request }) => {
      const statuses = new URL(request.url).searchParams.getAll("status");
      requests.push(statuses.join(","));
      const items = statuses.flatMap((status) => byStatus[status] ?? []);
      return HttpResponse.json(apiOk(bookingPageDto(items)));
    }),
  );
  return requests;
}

const renderList = (tab: string) =>
  renderWithProviders(<HostBookingList accountId="account-1" tab={hostTabOf(tab)} page={1} now={NOW} />, {
    theme: quintalTheme,
  });

describe("HostBookingList", { timeout: 15000 }, () => {
  it("REQ-HREQ-001 abas na URL, com a atual marcada e o contador de pedidos", async () => {
    serveLists({ requested: [bookingDto(), bookingDto({ id: "0199f0a0-0000-7000-8000-0000000000d2" })] });
    renderList("pedidos");
    const tabs = screen.getByRole("navigation", { name: copy.tabsLabel });
    const pedidos = await within(tabs).findByRole("link", { name: /Pedidos/ });
    expect(pedidos).toHaveAttribute("aria-current", "page");
    expect(pedidos).toHaveAttribute("href", "/host/bookings?aba=pedidos");
    expect(await within(tabs).findByText("2 esperando")).toBeInTheDocument();
    expect(within(tabs).getByRole("link", { name: "Anteriores" })).toHaveAttribute(
      "href",
      "/host/bookings?aba=anteriores",
    );
  });

  it("REQ-HREQ-002 cada pedido: tutor, pets, período, total e o prazo em Brasília", async () => {
    serveLists({
      requested: [
        bookingDto({
          pets: [
            { id: "0199f0a0-0000-7000-8000-0000000000e1", name: "Pipoca", species: "dog", size: "small" },
            { id: THOR_ID, name: "Thor", species: "cat", size: null },
          ],
          petCount: 2,
          totalPrice: 600,
          responseDeadline: "2026-12-11T12:00:00Z",
        }),
      ],
    });
    renderList("pedidos");
    const card = await screen.findByRole("article", { name: "Pedido de Camila Souza" });
    expect(card).toHaveTextContent("Pipoca (cachorro, porte pequeno)");
    expect(card).toHaveTextContent("Thor (gato)");
    expect(card).toHaveTextContent("20 a 25 de dez.");
    expect(card).toHaveTextContent("5 noites");
    expect(card.textContent).toMatch(/Total R\$\s600,00/);
    expect(card).toHaveTextContent("Responda até amanhã às 9h");
    expect(within(card).queryByText(copy.deadlineNear)).not.toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Ver pedido de Camila Souza" })).toHaveAttribute(
      "href",
      `/host/bookings/${bookingDto().id}`,
    );
  });

  it("REQ-HREQ-002 menos de 3 horas pro prazo: destaque", async () => {
    serveLists({ requested: [bookingDto({ responseDeadline: "2026-12-10T16:30:00Z" })] });
    renderList("pedidos");
    const card = await screen.findByRole("article", { name: "Pedido de Camila Souza" });
    expect(card).toHaveTextContent("Responda até hoje às 13h30");
    expect(within(card).getByText(copy.deadlineNear)).toBeInTheDocument();
  });

  it("REQ-HREQ-001 a aba pede só os seus status; vazia diz que não há nada", async () => {
    const requests = serveLists({});
    renderList("anteriores");
    expect(await screen.findByText(copy.empty.anteriores!)).toBeInTheDocument();
    expect(requests).toContain("completed,declined,expired,cancelled");
    expect(requests).toContain("requested");
  });
});
