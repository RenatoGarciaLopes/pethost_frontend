import { describe, expect, it } from "vitest";
import { CONVERSATIONS_NOW, previewStay } from "@/test/fixtures/conversations";
import type { Booking } from "@/features/bookings";
import { previewMessages } from "@/test/conversationsPreview";
import {
  stayBanner,
  stayBookingIdOf,
  stayDayPill,
  stayEvents,
  staySubtitle,
  toConversationStay,
  type ConversationStay,
} from "./stayContext";

const stay = (overrides: Partial<ConversationStay> = {}): ConversationStay => ({ ...previewStay, ...overrides });

describe("stayContext", () => {
  it("REQ-CHAT-011 linha de apoio com o cantinho e o bairro", () => {
    expect(staySubtitle(stay())).toBe("Casa da Dona Cida · Jd. Alvorada");
  });

  it("REQ-CHAT-011 em andamento: o dia da estadia, contando a chegada como dia 1", () => {
    expect(stayDayPill(stay(), CONVERSATIONS_NOW)).toBe("Pipoca aqui · dia 2 de 5");
    expect(stayDayPill(stay(), new Date("2026-12-20T15:00:00Z"))).toBe("Pipoca aqui · dia 1 de 5");
    // Depois da data de saída sem o "voltou pra casa", o selo para no último dia.
    expect(stayDayPill(stay(), new Date("2026-12-28T15:00:00Z"))).toBe("Pipoca aqui · dia 5 de 5");
  });

  it("REQ-CHAT-011 em andamento: faixa com o status e a frase, no plural com mais de um pet", () => {
    expect(stayBanner(stay())).toEqual({
      status: "Acontecendo",
      text: "20 a 25 de dez. · Pipoca está na casa de Dona Cida",
    });
    expect(stayBanner(stay({ petNames: ["Pipoca", "Thor"] }))?.text).toBe(
      "20 a 25 de dez. · Pipoca e Thor estão na casa de Dona Cida",
    );
  });

  it("REQ-CHAT-011 fora de 'em andamento', nem selo nem faixa", () => {
    expect(stayDayPill(stay({ status: "confirmed" }), CONVERSATIONS_NOW)).toBeNull();
    expect(stayBanner(stay({ status: "completed" }))).toBeNull();
  });

  it("REQ-CHAT-011 a chegada vira acontecimento da conversa; sem chegada, nada", () => {
    expect(stayEvents(stay())).toEqual([
      { id: "check-in", at: "2026-12-20T17:18:00Z", label: "Pipoca chegou na casa de Dona Cida" },
    ]);
    expect(stayEvents(stay({ checkedInAt: null }))).toEqual([]);
  });

  it("REQ-CHAT-011 a estadia da conversa é a da mensagem mais recente com reserva", () => {
    const messages = previewMessages();
    expect(stayBookingIdOf(messages)).toBe(messages[0]?.bookingId);
    expect(stayBookingIdOf(messages.map((message) => ({ ...message, bookingId: null })))).toBeNull();
  });

  it("REQ-CHAT-011 a reserva vira o contexto do painel; sem cantinho, nada", () => {
    const booking: Booking = {
      id: "0199f0a0-0000-7000-8000-0000000000d1",
      status: "in_progress",
      listing: {
        id: "0199e0a0-0000-7000-8000-0000000000c1",
        title: "Casa da Cida",
        neighborhood: "Zona 01",
        city: "Maringá",
      },
      owner: { name: "Camila Souza", avatarUrl: null },
      host: { name: "Aparecida Souza", avatarUrl: null },
      pets: [{ id: "0199f0a0-0000-7000-8000-0000000000e1", name: "Pipoca", species: "dog", size: "small" }],
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
      nights: 5,
      petCount: 1,
      nightlyRateCents: 6000,
      totalCents: 30000,
      responseDeadline: null,
      checkedInAt: "2026-12-20T17:18:00Z",
      checkedOutAt: null,
      cancelledBy: null,
      declineReason: null,
      refundPercentage: null,
      contact: null,
    };
    expect(toConversationStay(booking)).toEqual({
      status: "in_progress",
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
      petNames: ["Pipoca"],
      hostName: "Aparecida Souza",
      listingTitle: "Casa da Cida",
      neighborhood: "Zona 01",
      checkedInAt: "2026-12-20T17:18:00Z",
    });
    expect(toConversationStay({ ...booking, listing: null })).toBeNull();
  });
});
