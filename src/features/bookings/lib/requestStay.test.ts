import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { requestStayErrorMessage, requestStaySchema, toRequestBookingBody } from "./requestStay";

const TODAY = "2026-12-10";
const PET = "0199f0a0-0000-7000-8000-0000000000e1";
const OTHER = "0199f0a0-0000-7000-8000-0000000000e2";
const pets = [
  { id: PET, name: "Pipoca" },
  { id: OTHER, name: "Thor" },
];

const CARE = { food: true, meds: true };
const apiError = (code: string, message = "", status = 422) => new ApiError({ status, code, message });

describe("requestStaySchema", () => {
  const schema = requestStaySchema(TODAY);

  it("REQ-REQST-002 aceita período dentro das regras e de 1 a 10 pets", () => {
    expect(
      schema.safeParse({ checkIn: "2026-12-20", checkOut: "2026-12-25", petIds: [PET], careTermsAccepted: CARE })
        .success,
    ).toBe(true);
  });

  it("REQ-REQST-002 as datas seguem o stayRules, com o erro no campo", () => {
    const result = schema.safeParse({
      checkIn: "2026-12-20",
      checkOut: "2026-12-20",
      petIds: [PET],
      careTermsAccepted: CARE,
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.checkOut).toEqual(["A saída precisa ser depois da chegada."]);
    const past = schema.safeParse({
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      petIds: [PET],
      careTermsAccepted: CARE,
    });
    expect(past.error?.flatten().fieldErrors.checkIn).toEqual(["A chegada pode ser de hoje até 365 dias à frente."]);
  });

  it("REQ-REQST-010 a chegada precisa de 72 h: hoje + 4 dias passa, + 3 não", () => {
    const soon = schema.safeParse({
      checkIn: "2026-12-13",
      checkOut: "2026-12-15",
      petIds: [PET],
      careTermsAccepted: CARE,
    });
    expect(soon.error?.flatten().fieldErrors.checkIn).toEqual([
      "A chegada precisa ser daqui a pelo menos 3 dias: o anfitrião tem 24 horas pra responder.",
    ]);
    expect(
      schema.safeParse({ checkIn: "2026-12-14", checkOut: "2026-12-15", petIds: [PET], careTermsAccepted: CARE })
        .success,
    ).toBe(true);
  });

  it("REQ-REQST-004 as duas caixas do cuidado são obrigatórias, com o erro no grupo", () => {
    for (const careTermsAccepted of [
      { food: true, meds: false },
      { food: false, meds: true },
    ]) {
      const result = schema.safeParse({
        checkIn: "2026-12-20",
        checkOut: "2026-12-25",
        petIds: [PET],
        careTermsAccepted,
      });
      expect(result.error?.flatten().fieldErrors.careTermsAccepted).toEqual([
        "Marca os dois pra confirmar que a ração e os remédios vão junto.",
      ]);
    }
  });

  it("REQ-REQST-002 pede as duas datas", () => {
    const result = schema.safeParse({ checkIn: "", checkOut: "", petIds: [PET], careTermsAccepted: CARE });
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      checkIn: ["Escolhe uma data de chegada válida."],
      checkOut: ["Escolhe uma data de saída válida."],
    });
  });

  it("REQ-REQST-002 de 1 a 10 pets", () => {
    expect(
      schema
        .safeParse({ checkIn: "2026-12-20", checkOut: "2026-12-25", petIds: [], careTermsAccepted: CARE })
        .error?.flatten().fieldErrors.petIds,
    ).toEqual(["Escolhe pelo menos um pet."]);
    const eleven = Array.from(
      { length: 11 },
      (_, n) => `0199f0a0-0000-7000-8000-0000000001${String(n).padStart(2, "0")}`,
    );
    expect(
      schema
        .safeParse({ checkIn: "2026-12-20", checkOut: "2026-12-25", petIds: eleven, careTermsAccepted: CARE })
        .error?.flatten().fieldErrors.petIds,
    ).toEqual(["Dá pra levar até 10 pets por pedido."]);
  });
});

it("REQ-REQST-005 corpo do POST com o cantinho, os pets, as datas e o aceite do cuidado", () => {
  expect(
    toRequestBookingBody("listing-1", {
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
      petIds: [PET, OTHER],
      careTermsAccepted: CARE,
    }),
  ).toEqual({
    listingId: "listing-1",
    petIds: [PET, OTHER],
    checkIn: "2026-12-20",
    checkOut: "2026-12-25",
    careTermsAccepted: true,
  });
});

describe("requestStayErrorMessage", () => {
  it("REQ-REQST-007 dia fechado: o dia da semana que a API cita", () => {
    const error = apiError("BOOKING_WEEKDAY_NOT_AVAILABLE", "The listing does not receive on 2026-12-20.");
    expect(requestStayErrorMessage(error, pets)).toBe("O cantinho não recebe em domingo (20/12). Tenta outras datas.");
  });

  it("REQ-REQST-007 noite cheia: a noite que a API cita", () => {
    const error = apiError("BOOKING_CAPACITY_EXCEEDED", "No room on the night of 2026-12-22.");
    expect(requestStayErrorMessage(error, pets)).toBe(
      "Não tem vaga pra todos na noite de 22/12. Tenta outras datas ou menos pets.",
    );
  });

  it("REQ-REQST-007 pet em conflito: o nome do pet que a API cita", () => {
    const error = apiError("BOOKING_PET_PERIOD_CONFLICT", `Pet ${OTHER} already has a booking.`, 409);
    expect(requestStayErrorMessage(error, pets)).toBe("Thor já tem outra estadia nessas datas.");
  });

  it("REQ-REQST-007 sem o dado na mensagem, a frase geral do errorCopy", () => {
    expect(requestStayErrorMessage(apiError("BOOKING_CAPACITY_EXCEEDED"), pets)).toBe(
      "Não cabe mais ninguém nessas noites.",
    );
    expect(requestStayErrorMessage(apiError("BOOKING_PET_PERIOD_CONFLICT", "", 409), pets)).toBe(
      "Esse pet já tem outra estadia nessas datas.",
    );
    expect(requestStayErrorMessage(apiError("BOOKING_LISTING_NOT_FOUND", "", 404), pets)).toBe(
      "Esse cantinho não está recebendo pedidos agora.",
    );
  });
});
