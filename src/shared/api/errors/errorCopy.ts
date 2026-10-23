import { accountErrorCopy } from "./copy/accountErrorCopy";
import { bookingErrorCopy } from "./copy/bookingErrorCopy";
import { commonErrorCopy } from "./copy/commonErrorCopy";
import { hostApplicationErrorCopy } from "./copy/hostApplicationErrorCopy";
import { hostPayoutsErrorCopy } from "./copy/hostPayoutsErrorCopy";
import { listingErrorCopy } from "./copy/listingErrorCopy";
import { localErrorCopy } from "./copy/localErrorCopy";
import { petErrorCopy } from "./copy/petErrorCopy";
import { validationErrorCopy } from "./copy/validationErrorCopy";
import type { CopyCatalog } from "./copyTypes";

/**
 * Código de erro → frase da PetHost: a composição estática dos catálogos por domínio (`copy/`). É a única fonte da
 * microcopy de erro, de topo e de campo; só `translateError.ts` a lê. Domínio novo = arquivo novo em `copy/` e uma
 * linha aqui. Os catálogos moram em `shared` porque `shared` não pode importar `features`.
 */
export const errorCopy = {
  ...accountErrorCopy,
  ...petErrorCopy,
  ...hostApplicationErrorCopy,
  ...hostPayoutsErrorCopy,
  ...listingErrorCopy,
  ...bookingErrorCopy,
  ...validationErrorCopy,
  ...commonErrorCopy,
  ...localErrorCopy,
} satisfies CopyCatalog;

/** Códigos que têm tradução. */
export type TranslatedErrorCode = keyof typeof errorCopy;
