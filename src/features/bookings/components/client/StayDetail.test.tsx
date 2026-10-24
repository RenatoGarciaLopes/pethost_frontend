import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { StayDetail } from "./StayDetail";

const copy = bookingCopy.stay;
const NOW = new Date("2026-12-10T15:00:00Z");
const hostContact = {
  phone: "44988887777",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "Casa 2",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

function setup(overrides: Record<string, unknown>) {
  const queryClient = createTestQueryClient();
  const key = bookingQueries.detail("account-1", BOOKING_ID).queryKey;
  queryClient.setQueryDefaults(key, { staleTime: Infinity });
  queryClient.setQueryData(key, toBooking(bookingDtoSchema.parse(bookingDto(overrides))));
  return renderWithProviders(<StayDetail accountId="account-1" bookingId={BOOKING_ID} now={NOW} />, {
    theme: quintalTheme,
    queryClient,
  });
}

describe("StayDetail", () => {
  it("REQ-STAYS-004 cabeçalho humano, trilha com o passo atual, resumo com a conta e o prazo do anfitrião", () => {
    setup({});
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pipoca na casa de Aparecida Souza");
    expect(screen.getByText("Casa da Cida · Zona 01, Maringá")).toBeInTheDocument();
    const trail = screen.getByRole("list", { name: copy.trail });
    expect(within(trail).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
    const summary = screen.getByRole("region", { name: copy.summary });
    expect(summary).toHaveTextContent("dom., 20 de dez.");
    expect(summary).toHaveTextContent("sex., 25 de dez.");
    expect(summary.textContent).toMatch(/R\$\s60,00 × 5 noites × 1 pet/);
    expect(summary.textContent).toMatch(/Total\s*R\$\s300,00/);
    expect(screen.getByText("Aparecida Souza responde até amanhã às 9h.")).toBeInTheDocument();
    expect(screen.getByText("O pedido ainda não segura a vaga.")).toBeInTheDocument();
  });

  it("REQ-STAYS-010 aceita: o prazo de pagamento e o botão Pagar com o total levam ao checkout", () => {
    setup({ status: "accepted", responseDeadline: null, paymentDeadline: "2026-12-10T21:30:00Z" });
    expect(screen.getByText("Pague até hoje às 18h30 pra garantir a vaga.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Pagar R\$\s300,00$/ })).toHaveAttribute(
      "href",
      `/owner/bookings/${BOOKING_ID}/payment`,
    );
  });

  it("REQ-PAY-011 concluída oferece pagamento e parcelas no painel atual", () => {
    setup({
      status: "completed",
      responseDeadline: null,
      checkedInAt: "2026-12-20T15:00:00Z",
      checkedOutAt: "2026-12-25T15:00:00Z",
    });
    expect(screen.getByText("Estadia concluída. Obrigado por confiar em Aparecida Souza.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Pagar|Avaliar/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver pagamento e parcelas" })).toHaveAttribute("href", `/owner/bookings/${BOOKING_ID}/payment`);
  });

  it('REQ-STAYS-006 "Cancelar estadia" só em pedido e confirmada', () => {
    setup({ status: "in_progress", responseDeadline: null });
    expect(screen.queryByRole("button", { name: "Cancelar estadia" })).not.toBeInTheDocument();
  });

  it.each(["confirmed", "in_progress", "completed"])(
    "REQ-STAYS-005 em %s, o contato: telefone formatado com tel: e o endereço exato",
    (status) => {
      setup({ status, responseDeadline: null, contact: hostContact });
      const contact = screen.getByRole("region", { name: copy.contact });
      expect(within(contact).getByRole("link", { name: "(44) 98888-7777" })).toHaveAttribute("href", "tel:44988887777");
      expect(contact).toHaveTextContent("Avenida Brasil, 120, Casa 2");
      expect(contact).toHaveTextContent("Zona 01, Maringá - PR, 87020-000");
      expect(screen.getByRole("link", { name: "Ver pagamento e parcelas" })).toHaveAttribute("href", `/owner/bookings/${BOOKING_ID}/payment`);
    },
  );

  it.each(["requested", "declined", "expired", "cancelled"])(
    "REQ-STAYS-005 em %s, nenhum dado de contato",
    (status) => {
      // Mesmo se a API mandasse, a tela não mostra contato fora dos status liberados.
      setup({ status, contact: hostContact });
      expect(screen.queryByRole("region", { name: copy.contact })).not.toBeInTheDocument();
      expect(screen.queryByText(/98888-7777/)).not.toBeInTheDocument();
    },
  );

  it("REQ-STAYS-008 recusada: o motivo do anfitrião e o caminho de procurar outro cantinho", () => {
    setup({ status: "declined", responseDeadline: null, declineReason: "Já estou com a casa cheia" });
    expect(screen.getByText("Aparecida Souza não pôde receber dessa vez.")).toBeInTheDocument();
    expect(screen.getByText("Nada foi cobrado.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: copy.trail })).not.toBeInTheDocument();
    expect(screen.getByText("Motivo: Já estou com a casa cheia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.searchAgain })).toHaveAttribute("href", "/");
  });

  it("REQ-STAYS-008 expirada: o anfitrião não respondeu a tempo", () => {
    setup({ status: "expired", responseDeadline: null });
    expect(screen.getByText("Aparecida Souza não respondeu a tempo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.searchAgain })).toBeInTheDocument();
  });
});
