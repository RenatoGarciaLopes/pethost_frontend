import { uploadErrorCopy } from "./copy/uploadErrorCopy";
import { accountErrorCopy } from "./copy/accountErrorCopy";
import { bookingErrorCopy } from "./copy/bookingErrorCopy";
import { commonErrorCopy } from "./copy/commonErrorCopy";
import { hostApplicationErrorCopy } from "./copy/hostApplicationErrorCopy";
import { hostPayoutsErrorCopy } from "./copy/hostPayoutsErrorCopy";
import { conversationErrorCopy } from "./copy/conversationErrorCopy";
import { listingErrorCopy } from "./copy/listingErrorCopy";
import { localErrorCopy } from "./copy/localErrorCopy";
import { paymentErrorCopy } from "./copy/paymentErrorCopy";
import { petErrorCopy } from "./copy/petErrorCopy";
import { reviewErrorCopy } from "./copy/reviewErrorCopy";
import { authValidationCopy } from "./copy/validation/authValidationCopy";
import { bookingValidationCopy } from "./copy/validation/bookingValidationCopy";
import { commonValidationCopy } from "./copy/validation/commonValidationCopy";
import { conversationValidationCopy } from "./copy/validation/conversationValidationCopy";
import { hostValidationCopy } from "./copy/validation/hostValidationCopy";
import { listingValidationCopy } from "./copy/validation/listingValidationCopy";
import { petValidationCopy } from "./copy/validation/petValidationCopy";
import { reviewValidationCopy } from "./copy/validation/reviewValidationCopy";
import type { CopyEntry } from "./copyTypes";
import type { ApiErrorCode } from "../generated/errorCodes";

/**
 * Código de erro → frase da PetHost: a composição estática dos catálogos por domínio (`copy/`). É a única fonte da
 * microcopy de erro, de topo e de campo; só `translateError.ts` a lê. O tipo `Record<TranslatedErrorCode, ...>` vem do enum `ApiErrorCode` do OpenAPI: código novo na API sem frase quebra o tsc.
 * Domínio novo = arquivo novo em `copy/` e uma linha aqui. Os catálogos moram em `shared` porque `shared` não pode importar `features`.
 */
/** Códigos que nascem no front (transporte e BFF) e por isso não estão no enum da API. */
type LocalErrorCode = "NETWORK_ERROR" | "SESSION_EXPIRED" | "CSRF_REJECTED" | "UPLOAD_TRANSFER_FAILED";

/** Todo código que tem frase: os da API (enum do OpenAPI) mais os locais. */
export type TranslatedErrorCode = ApiErrorCode | LocalErrorCode;

/**
 * Código de erro → frase da PetHost: a composição estática dos catálogos por domínio (`copy/`). É a única fonte da
 * microcopy de erro, de topo e de campo; só `translateError.ts` a lê. O tipo `Record<TranslatedErrorCode, ...>` vem do enum `ApiErrorCode` do OpenAPI: código novo na API sem frase quebra o tsc.
 * Domínio novo = arquivo novo em `copy/` e uma linha aqui. Os catálogos moram em `shared` porque `shared` não pode importar `features`.
 */
export const errorCopy: Record<TranslatedErrorCode, CopyEntry> = {
  ...accountErrorCopy,
  ...petErrorCopy,
  ...hostApplicationErrorCopy,
  ...hostPayoutsErrorCopy,
  ...listingErrorCopy,
  ...bookingErrorCopy,
  ...conversationErrorCopy,
  ...paymentErrorCopy,
  ...reviewErrorCopy,
  ...authValidationCopy,
  ...bookingValidationCopy,
  ...commonValidationCopy,
  ...conversationValidationCopy,
  ...hostValidationCopy,
  ...listingValidationCopy,
  ...petValidationCopy,
  ...reviewValidationCopy,
  ...commonErrorCopy,
  ...localErrorCopy,
  ...uploadErrorCopy,
};
