import { z } from "zod";
import { hasErrorCode, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { validateRequestStay } from "@/shared/lib/date/stayRules";
import { bookingCopy } from "./bookingCopy";
import { bookingErrorDetail } from "./bookingErrorDetail";

const copy = bookingCopy.request;
/** Limite da API: de 1 a 10 pets por pedido. */
const MAX_PETS = 10;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const weekdayName = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

/**
 * Formulário do pedido (REQ-REQST-002): datas pelas regras do `stayRules` (chegada com 72 h de antecedência até 365 dias, até 30 noites,
 * sempre as duas), de 1 a 10 pets e as duas caixas do cuidado marcadas. `today` vem do servidor, em Brasília.
 *
 * @example useForm({ resolver: zodResolver(requestStaySchema(today)) })
 */
export function requestStaySchema(today: string) {
  return z
    .object({
      checkIn: z.string(),
      checkOut: z.string(),
      petIds: z.array(z.string()).min(1, copy.petsMin).max(MAX_PETS, copy.petsMax),
      // A API recebe um só `careTermsAccepted`; na tela são as duas caixas, e o erro fica no grupo.
      careTermsAccepted: z.object({ food: z.boolean(), meds: z.boolean() }),
    })
    .superRefine((values, context) => {
      const errors = validateRequestStay(values.checkIn, values.checkOut, today);
      for (const field of ["checkIn", "checkOut"] as const) {
        const message = errors[field];
        if (message) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
      if (!values.careTermsAccepted.food || !values.careTermsAccepted.meds)
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["careTermsAccepted"], message: copy.careTerms });
    });
}

export type RequestStayValues = z.infer<ReturnType<typeof requestStaySchema>>;

/**
 * Corpo de `POST /bookings` (REQ-REQST-005).
 * @example await requestBooking(toRequestBookingBody(listing.id, values));
 */
export function toRequestBookingBody(listingId: string, values: RequestStayValues) {
  return {
    listingId,
    petIds: [...values.petIds],
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    careTermsAccepted: true as const,
  };
}

export type RequestBookingBody = ReturnType<typeof toRequestBookingBody>;

/**
 * Frase da PetHost para um erro de regra do pedido (REQ-REQST-007), com o dado que a API cita na mensagem: o dia
 * fechado, a noite sem vaga ou o pet em conflito. Sem o dado, a frase geral do `errorCopy`.
 *
 * @example setNotice(requestStayErrorMessage(error, pets));
 */
export function requestStayErrorMessage(error: unknown, pets: readonly { id: string; name: string }[]): string {
  const detail = bookingErrorDetail(error);
  if (detail && hasErrorCode(error, "BOOKING_WEEKDAY_NOT_AVAILABLE"))
    return copy.weekday(`${weekdayName.format(new Date(`${detail.date}T00:00:00Z`))} (${detail.dateLabel})`);
  if (detail && hasErrorCode(error, "BOOKING_CAPACITY_EXCEEDED")) return copy.capacity(detail.dateLabel);
  if (isApiError(error) && hasErrorCode(error, "BOOKING_PET_PERIOD_CONFLICT")) {
    const cited = new Set((error.message.match(UUID) ?? []).map((id) => id.toLowerCase()));
    const pet = pets.find((item) => cited.has(item.id.toLowerCase()));
    if (pet) return copy.petConflict(pet.name);
  }
  return getErrorMessage(error);
}
