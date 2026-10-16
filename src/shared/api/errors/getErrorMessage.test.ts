import { describe, expect, it } from "vitest";
import { ApiError } from "./ApiError";
import { errorCopy, GENERIC_ERROR_MESSAGE } from "./errorCopy";
import { getErrorMessage } from "./getErrorMessage";

const apiError = (code: string, extra: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) =>
  new ApiError({ status: 400, code, message: "english from the API", ...extra });

describe("getErrorMessage", () => {
  it("REQ-AQUEUE-013 conflitos e identidades duplicadas têm orientação administrativa", () => {
    for (const code of ["HOST_APPLICATION_CONFLICT", "HOST_APPLICATION_NOT_UNDER_REVIEW"])
      expect(getErrorMessage(apiError(code))).toBe("Outra pessoa da equipe já decidiu essa verificação.");
    expect(getErrorMessage(apiError("HOST_CPF_ALREADY_REGISTERED"), { adminReview: true })).toContain("Recuse com");
    expect(getErrorMessage(apiError("HOST_CPF_ALREADY_REGISTERED"))).not.toContain("Recuse com");
  });
  it("REQ-PNEW-007 tipo de arquivo recusado tem frase em português", () => {
    expect(getErrorMessage(apiError("UNSUPPORTED_MEDIA_TYPE"))).toBe(
      "Esse arquivo não é uma foto: use JPG, PNG ou WebP.",
    );
  });
  it.each([
    [
      "OWNER_CPF_LOCKED",
      "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
    ],
    [
      "OWNER_BIRTH_DATE_LOCKED",
      "Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte.",
    ],
    ["HOST_IDENTITY_LOCKED", "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte."],
    ["HOST_NOT_FOUND", "Seus dados ficam editáveis depois da verificação."],
    ["OWNER_NOT_FOUND", "Não achamos seu perfil de tutor. Fala com o suporte."],
    ["HOST_NOT_A_COMPANY", "Esses dados são só de conta de empresa."],
    ["PAYLOAD_TOO_LARGE", "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB."],
  ])("REQ-ACC-007/010/011/017 %s usa a frase da spec", (code, expected) => {
    expect(getErrorMessage(apiError(code!))).toBe(expected);
  });
  it.each([
    ["HOST_CNPJ_ALREADY_REGISTERED", "Esse CNPJ já está em outra conta. Se a empresa é sua, fala com o suporte."],
    ["HOST_APPLICATION_ALREADY_EXISTS", "Você já tem uma verificação aberta. Vamos continuar de onde parou."],
    ["HOST_ALREADY_VERIFIED", "Sua verificação já foi aprovada."],
    ["HOST_APPLICATION_NOT_EDITABLE", "Essa verificação já foi enviada e não dá mais pra mudar."],
    ["HOST_APPLICATION_COMPANY_DATA_NOT_ALLOWED", "Dados de empresa só valem pra verificação de empresa."],
    ["HOST_APPLICATION_DOCUMENTS_MISSING", "Ainda falta foto. Confere as três vagas antes de enviar."],
  ])("REQ-HVER-019 %s usa a frase da spec", (code, expected) => {
    expect(getErrorMessage(apiError(code!))).toBe(expected);
  });
  it.each([
    ["LISTING_HOST_PAYOUTS_NOT_ENABLED", "Seu cantinho abre depois que o recebimento estiver conectado."],
    ["LISTING_LIMIT_REACHED", "Você já tem um cantinho. Dá pra editar ele quando quiser."],
    ["LISTING_HOST_NOT_FOUND", "O cantinho abre depois que a sua verificação for aprovada."],
    ["LISTING_HOST_DEACTIVATED", "Sua conta de anfitrião está pausada. Reative a conta pra mexer no cantinho."],
    [
      "LISTING_GEOCODER_UNAVAILABLE",
      "Não conseguimos achar o endereço no mapa agora. Tenta de novo em alguns minutos.",
    ],
    ["LISTING_ADDRESS_NOT_LOCATED", "Não achamos esse endereço no mapa. Confere o CEP, a rua e o número."],
    ["LISTING_PHOTO_LIMIT_REACHED", "Já tem 5 fotos. Tira uma pra colocar outra."],
    ["LISTING_PHOTO_ALREADY_EXISTS", "Essa foto já está no cantinho."],
    ["LISTING_NOT_FOUND", "Não achamos esse cantinho."],
  ])("REQ-LIST-012 %s usa a frase da PetHost", (code, expected) => {
    expect(getErrorMessage(apiError(code!))).toBe(expected);
  });
  it.each([
    ["BOOKING_NOT_FOUND", "Não achamos essa estadia."],
    ["BOOKING_OWNER_NOT_FOUND", "Pra pedir estadia, falta o seu perfil de tutor."],
    ["BOOKING_OWNER_DEACTIVATED", "Sua conta de tutor está pausada."],
    ["BOOKING_OWNER_INACTIVE", "Esse tutor não está mais ativo. Dá pra recusar ou deixar expirar."],
    ["BOOKING_HOST_NOT_FOUND", "Os pedidos chegam depois que a sua verificação for aprovada."],
    ["BOOKING_HOST_DEACTIVATED", "Sua conta de anfitrião está pausada. Reative a conta pra responder pedidos."],
    ["BOOKING_LISTING_NOT_FOUND", "Esse cantinho não está recebendo pedidos agora."],
    ["BOOKING_PET_NOT_FOUND", "Não achamos esse pet na sua lista."],
    ["BOOKING_PET_INACTIVE", "Esse pet está fora da sua lista. Volta ele pra lista pra pedir."],
    ["BOOKING_PET_SPECIES_NOT_ACCEPTED", "Esse cantinho não recebe esse tipo de bicho."],
    ["BOOKING_PET_SIZE_NOT_ACCEPTED", "Esse cantinho não recebe esse porte."],
    ["BOOKING_PET_PERIOD_CONFLICT", "Esse pet já tem outra estadia nessas datas."],
    ["BOOKING_WEEKDAY_NOT_AVAILABLE", "O cantinho não recebe em algum dia desse período. Tenta outras datas."],
    ["BOOKING_CAPACITY_EXCEEDED", "Não cabe mais ninguém nessas noites."],
    ["BOOKING_NOT_AWAITING_RESPONSE", "Esse pedido já foi respondido. A tela foi atualizada."],
    ["BOOKING_RESPONSE_EXPIRED", "O prazo de 24 horas passou e o pedido expirou."],
    ["BOOKING_ALREADY_CANCELLED", "Essa estadia já foi cancelada."],
    ["BOOKING_ALREADY_CLOSED", "Esse pedido já foi recusado ou expirou: não há o que cancelar."],
    ["BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN", "Depois que o pet chegou, não dá pra cancelar."],
    ["BOOKING_NOT_CONFIRMED", "Só dá pra marcar a chegada de estadia confirmada."],
    ["BOOKING_CHECK_IN_TOO_EARLY", "Ainda não é o dia da chegada."],
    ["BOOKING_CHECK_IN_WINDOW_CLOSED", "O período dessa estadia já passou."],
    ["BOOKING_NOT_IN_PROGRESS", "Só dá pra marcar a volta de estadia que está acontecendo."],
    ["BOOKING_CONFLICT", "A estadia mudou enquanto você olhava. Confere de novo."],
  ])("REQ-HREQ-006 REQ-STDAY-006 %s usa a frase da PetHost", (code, expected) => {
    expect(getErrorMessage(apiError(code!))).toBe(expected);
  });
  it.each(Object.keys(errorCopy))("REQ-HTTP-005 %s tem frase da PetHost e nunca a mensagem da API", (code) => {
    const message = getErrorMessage(apiError(code, { retryAfterSeconds: 5 }));

    expect(message).not.toBe("english from the API");
    expect(message.length).toBeGreaterThan(10);
    expect(message).not.toMatch(/\{|\}/);
  });

  it("REQ-HTTP-005 código desconhecido cai na frase genérica", () => {
    expect(getErrorMessage(apiError("SOMETHING_NEW"))).toBe(GENERIC_ERROR_MESSAGE);
    expect(GENERIC_ERROR_MESSAGE).toMatch(/^Deu um problema do nosso lado/);
  });

  it("REQ-HTTP-005 erro que não é ApiError cai na frase genérica", () => {
    expect(getErrorMessage(new Error("boom"))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("REQ-HTTP-005 e-mail já cadastrado muda com o tipo de conta", () => {
    const error = apiError("AUTH_EMAIL_ALREADY_REGISTERED");

    expect(getErrorMessage(error, { role: "owner" })).toBe("Esse e-mail já tem conta de tutor. Quer entrar?");
    expect(getErrorMessage(error, { role: "host" })).toBe("Esse e-mail já tem conta de anfitrião. Quer entrar?");
    expect(getErrorMessage(error)).toBe("Esse e-mail já tem conta. Quer entrar?");
  });

  it("REQ-HTTP-005 limite de tentativas mostra os segundos do Retry-After", () => {
    expect(getErrorMessage(apiError("TOO_MANY_REQUESTS", { retryAfterSeconds: 30 }))).toBe(
      "Muitas tentativas seguidas. Respira e tenta de novo em 30 segundos.",
    );
    expect(getErrorMessage(apiError("TOO_MANY_REQUESTS", { retryAfterSeconds: 1 }))).toBe(
      "Muitas tentativas seguidas. Respira e tenta de novo em 1 segundo.",
    );
    expect(getErrorMessage(apiError("TOO_MANY_REQUESTS"))).toBe(
      "Muitas tentativas seguidas. Respira e tenta de novo daqui a pouco.",
    );
  });

  it("REQ-HTTP-005 frases da tabela do contrato", () => {
    expect(getErrorMessage(apiError("AUTH_INVALID_CREDENTIALS"))).toBe(
      "E-mail ou senha não batem com essa conta. Confere se você é tutor ou anfitrião aqui em cima.",
    );
    expect(getErrorMessage(apiError("NETWORK_ERROR"))).toMatch(/conexão/);
  });
});
it.each([
  ["HOST_STRIPE_UNAVAILABLE", "O Stripe não respondeu agora. Tenta de novo em alguns minutos."],
  ["HOST_STRIPE_REQUEST_REJECTED", "O Stripe não aceitou esses dados. Fala com o suporte pra gente conferir."],
  [
    "HOST_STRIPE_ONBOARDING_NOT_ALLOWED",
    "O cadastro de recebimento não está disponível pra essa conta agora. Fala com o suporte.",
  ],
  [
    "HOST_STRIPE_ACCOUNT_REJECTED",
    "O Stripe não aprovou o recebimento dessa conta. Fala com a gente pra entender o que aconteceu.",
  ],
  ["HOST_STRIPE_ACCOUNT_ALREADY_EXISTS", "Essa conta já tem recebimento conectado. Pra trocar, fala com o suporte."],
  ["HOST_STRIPE_ACCOUNT_NOT_FOUND", "Você ainda não começou seu cadastro de recebimento. Começa por aqui."],
])("REQ-PAYOUT-012 %s tem frase própria", (code, message) => {
  expect(getErrorMessage(apiError(code))).toBe(message);
});
