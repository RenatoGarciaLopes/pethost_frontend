import { z } from "zod";
import { hasErrorCode, isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { validateStay } from "@/shared/lib/date/stayRules";
import { bookingCopy } from "./bookingCopy";
import { bookingErrorDetail } from "./bookingErrorDetail";

const copy = bookingCopy.request;
/** Limite da API: de 1 a 10 pets por pedido. */
const MAX_PETS = 10;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const weekdayName = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

/**
 * Formulário do pedido (REQ-REQST-002): datas pelas regras do `stayRules` (chegada de hoje a 365 dias, até 30 noites,
 * sempre as duas) e de 1 a 10 pets. `today` vem do servidor, em Brasília.
 *
 * @example useForm({ resolver: zodResolver(requestStaySchema(today)) })
 */
export function requestStaySchema(today: string) {
  return z
    .object({
      checkIn: z.string(),
      checkOut: z.string(),
      petIds: z.array(z.string()).min(1, copy.petsMin).max(MAX_PETS, copy.petsMax),
    })
    .superRefine((values, context) => {
      // Sem as duas datas o stayRules libera (vale para a busca); aqui o pedido exige o período.
      const errors = validateStay(values.checkIn || " ", values.checkOut || " ", today);
      for (const field of ["checkIn", "checkOut"] as const) {
        const message = errors[field];
        if (message) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    });
}

export type RequestStayValues = z.infer<ReturnType<typeof requestStaySchema>>;

/**
 * Corpo de `POST /bookings` (REQ-REQST-005).
 * @example await requestBooking(toRequestBookingBody(listing.id, values));
 */
export function toRequestBookingBody(listingId: string, values: RequestStayValues) {
  return { listingId, petIds: [...values.petIds], checkIn: values.checkIn, checkOut: values.checkOut };
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
  return translateError(error);
}
