import { formatHours } from "../formatErrorParams";
import type { CopyCatalog } from "../copyTypes";

/** Reservas e estadias (specs 050 a 054). */
export const bookingErrorCopy = {
  BOOKING_NOT_FOUND: "Não achamos essa estadia.",
  BOOKING_OWNER_NOT_FOUND: "Pra pedir estadia, falta o seu perfil de tutor.",
  BOOKING_OWNER_DEACTIVATED: "Sua conta de tutor está pausada.",
  BOOKING_OWNER_INACTIVE: "Esse tutor não está mais ativo. Dá pra recusar ou deixar expirar.",
  BOOKING_HOST_NOT_FOUND: "Os pedidos chegam depois que a sua verificação for aprovada.",
  BOOKING_HOST_DEACTIVATED: "Sua conta de anfitrião está pausada. Reative a conta pra responder pedidos.",
  BOOKING_LISTING_NOT_FOUND: "Esse cantinho não está recebendo pedidos agora.",
  BOOKING_PET_NOT_FOUND: "Não achamos esse pet na sua lista.",
  BOOKING_PET_INACTIVE: "Esse pet está fora da sua lista. Volta ele pra lista pra pedir.",
  BOOKING_PET_SPECIES_NOT_ACCEPTED: "Esse cantinho não recebe esse tipo de bicho.",
  BOOKING_PET_SIZE_NOT_ACCEPTED: "Esse cantinho não recebe esse porte.",
  BOOKING_PET_PERIOD_CONFLICT: "Esse pet já tem outra estadia nessas datas.",
  BOOKING_WEEKDAY_NOT_AVAILABLE: "O cantinho não recebe em algum dia desse período. Tenta outras datas.",
  BOOKING_CAPACITY_EXCEEDED: "Não cabe mais ninguém nessas noites.",
  BOOKING_NOT_AWAITING_RESPONSE: "Esse pedido já foi respondido. A tela foi atualizada.",
  BOOKING_RESPONSE_EXPIRED: "O prazo de 24 horas passou e o pedido expirou.",
  BOOKING_ALREADY_CANCELLED: "Essa estadia já foi cancelada.",
  BOOKING_ALREADY_CLOSED: "Esse pedido já foi recusado ou expirou: não há o que cancelar.",
  BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN: "Depois que o pet chegou, não dá pra cancelar.",
  BOOKING_NOT_CONFIRMED: "Só dá pra marcar a chegada de estadia confirmada.",
  BOOKING_CHECK_IN_TOO_EARLY: "Ainda não é o dia da chegada.",
  BOOKING_CHECK_IN_WINDOW_CLOSED: "O período dessa estadia já passou.",
  BOOKING_NOT_IN_PROGRESS: "Só dá pra marcar a volta de estadia que está acontecendo.",
  BOOKING_CONFLICT: "A estadia mudou enquanto você olhava. Confere de novo.",

  // Regras do pedido de estadia, validadas por campo
  BOOKING_CHECK_IN_TOO_SOON: ({ params }) => {
    const minimum = typeof params.minimumHours === "number" ? formatHours(params.minimumHours) : "mais tempo";
    const response =
      typeof params.responseHours === "number"
        ? ` O anfitrião tem até ${formatHours(params.responseHours)} pra responder.`
        : "";
    return `A chegada precisa ser com pelo menos ${minimum} de antecedência.${response}`;
  },
  BOOKING_CARE_TERMS_NOT_ACCEPTED:
    "Confirma que você vai levar a comida do pet e entregar os remédios dele ao anfitrião.",
  BOOKING_DATES_BLOCKED: "O anfitrião não recebe em alguma dessas datas. Tenta outras.",
  BOOKING_LISTING_NOT_BOOKABLE: "Esse cantinho não está recebendo pedidos agora.",
  BOOKING_NOT_AWAITING_PAYMENT: "Essa estadia não está esperando pagamento.",
  BOOKING_OWNER_PAYMENT_OVERDUE: "Tem um pagamento seu em atraso. Regulariza pra pedir outra estadia.",
  BOOKING_OWN_LISTING: "Você não pode pedir estadia no seu próprio cantinho.",
} satisfies CopyCatalog;
