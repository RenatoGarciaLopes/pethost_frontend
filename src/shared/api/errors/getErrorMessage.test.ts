import { describe, expect, it } from "vitest";
import { ApiError } from "./ApiError";
import { errorCopy, GENERIC_ERROR_MESSAGE } from "./errorCopy";
import { getErrorMessage } from "./getErrorMessage";

const apiError = (code: string, extra: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) =>
  new ApiError({ status: 400, code, message: "english from the API", ...extra });

describe("getErrorMessage", () => {
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
