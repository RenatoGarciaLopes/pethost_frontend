import type { CopyCatalog } from "../../copyTypes";
import { invalid, numberParam, required, upTo } from "../phrases";

/** Validação de campo: common. */
export const commonValidationCopy = {
  AUDIT_PAGE_INVALID: invalid("a página"),
  AUDIT_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  AUDIT_PERIOD_INVALID: "O período não vale: a data inicial precisa vir antes da final.",
  IMAGE_FILE_CORRUPTED: "Essa foto está corrompida. Tenta outra.",
  IMAGE_FILE_EMPTY: "Essa foto está vazia. Tenta outra.",
  IMAGE_FILE_REQUIRED: "Falta escolher a foto.",
  IMAGE_FILE_TOO_LARGE: ({ params }) => {
    const mb = numberParam(params, "maxMegabytes");
    return mb ? `A foto pode ter até ${mb} MB.` : "Essa foto é grande demais.";
  },
  IMAGE_UNSUPPORTED_FORMAT: "Usa uma foto JPG, PNG ou WebP.",
  PAYMENT_BOOKING_ID_REQUIRED: required("a estadia"),
  PAYMENT_INSTALLMENT_COUNT_INVALID: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `O número de parcelas precisa ser de 1 a ${max}.` : "Confere o número de parcelas.";
  },
  PAYMENT_INSTALLMENT_NUMBER_INVALID: ({ params }) => {
    const max = numberParam(params, "max");
    return max ? `A parcela precisa ser de 1 a ${max}.` : "Confere a parcela.";
  },
  PAYMENT_PAGE_INVALID: invalid("a página"),
  PAYMENT_PAGE_SIZE_INVALID: upTo("o tamanho da página"),
  PAYMENT_STRIPE_OBJECT_ID_REQUIRED: required("o objeto do Stripe"),
  REQUEST_BODY_INVALID: "Não deu pra ler esse pedido. Confere o que foi preenchido.",
  REQUEST_VALUE_INVALID: "Confere esse campo.",
  STRIPE_WEBHOOK_SIGNATURE_INVALID: "A assinatura do Stripe não confere.",
} satisfies CopyCatalog;
