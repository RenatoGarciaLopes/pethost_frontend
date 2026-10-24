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
  it("REQ-PAY-001 aceita oferece checkout e mantém contato privado", () => {
    setup({ status: "accepted", contact: hostContact });
    expect(screen.getByRole("link", { name: "Pagar estadia" })).toHaveAttribute(
      "href",
      `/owner/bookings/${BOOKING_ID}/payment`,
    );
    expect(screen.queryByRole("region", { name: copy.contact })).not.toBeInTheDocument();
  });
  it("REQ-STAYS-004 trilha com o passo atual, resumo com a conta e o prazo do anfitrião", () => {
    setup({});
    const trail = screen.getByRole("list", { name: copy.trail });
    expect(within(trail).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Casa da Cida")).toBeInTheDocument();
    expect(screen.getByText("20 a 25 de dez.")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s60,00 × 5 noites × 1 pet = R\$\s300,00/)).toBeInTheDocument();
    expect(screen.getByText("Aparecida Souza responde até amanhã às 9h")).toBeInTheDocument();
  });

  it.each(["confirmed", "in_progress", "completed"])(
    "REQ-STAYS-005 em %s, o contato: telefone formatado com tel: e o endereço exato",
    (status) => {
      setup({ status, responseDeadline: null, contact: hostContact });
      const contact = screen.getByRole("region", { name: copy.contact });
      expect(within(contact).getByRole("link", { name: "(44) 98888-7777" })).toHaveAttribute("href", "tel:44988887777");
      expect(contact).toHaveTextContent("Avenida Brasil, 120, Casa 2");
      expect(contact).toHaveTextContent("Zona 01, Maringá - PR, 87020-000");
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
    expect(screen.getByText("Motivo: Já estou com a casa cheia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.searchAgain })).toHaveAttribute("href", "/");
  });

  it("REQ-STAYS-008 expirada: o anfitrião não respondeu a tempo", () => {
    setup({ status: "expired", responseDeadline: null });
    expect(screen.getByText("Aparecida Souza não respondeu a tempo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.searchAgain })).toBeInTheDocument();
  });
});
