import { z } from "zod";
import { compareCalendarDates, isAdult, parseBrazilianDate, todayCalendarDate } from "@/shared/lib/date";
import { isValidCpf } from "@/shared/lib/documents";
import { createAddressSchema } from "@/shared/lib/validation/address";
import { isStrongPassword } from "@/shared/lib/validation/password";
import { registrationCopy } from "../lib/registrationCopy";

const errors = registrationCopy.fieldErrors;

/** Limites da API (`modulo-auth.md` seção 5.1). A API continua sendo a fonte: o 400 dela sempre vence. */
const FULL_NAME_MAX = 120;
const EMAIL_MAX = 160;

/** Nascimento como a pessoa digita (8 dígitos de `dd/mm/aaaa`): data que existe, no passado, 18 anos ou mais. */
const birthDateSchema = z.string().superRefine((digits, context) => {
  if (!digits) return context.addIssue({ code: z.ZodIssueCode.custom, message: errors.birthDateMissing });
  const date = parseBrazilianDate(digits);
  if (!date) return context.addIssue({ code: z.ZodIssueCode.custom, message: errors.birthDateInvalid });
  const today = todayCalendarDate();
  if (compareCalendarDates(date, today) > 0) {
    return context.addIssue({ code: z.ZodIssueCode.custom, message: errors.birthDateFuture });
  }
  if (!isAdult(date, today)) context.addIssue({ code: z.ZodIssueCode.custom, message: errors.underage });
});

/**
 * Conta de pessoa, comum a tutor e anfitrião: nome, e-mail, senha forte, celular, nascimento e endereço.
 * Telefone, nascimento e CEP ficam só com dígitos (os campos mascarados guardam assim).
 */
const accountFormSchema = z.object({
  fullName: z.string().trim().min(1, errors.fullNameMissing).max(FULL_NAME_MAX, errors.tooLong(FULL_NAME_MAX)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, errors.emailMissing)
    .max(EMAIL_MAX, errors.tooLong(EMAIL_MAX))
    .email(errors.emailInvalid),
  password: z.string().refine(isStrongPassword, errors.passwordWeak),
  phone: z.string().regex(/^\d{10,11}$/, errors.phoneInvalid),
  birthDate: birthDateSchema,
  address: createAddressSchema(errors),
});

/** Cadastro de tutor (spec 011, REQ-OREG-003): a conta mais o CPF. */
export const ownerRegistrationSchema = accountFormSchema.extend({
  cpf: z.string().min(1, errors.cpfMissing).refine(isValidCpf, errors.cpfInvalid),
});

/** Valores digitados (antes da normalização). */
export type OwnerRegistrationInput = z.input<typeof ownerRegistrationSchema>;
/** Valores validados e normalizados, prontos para o mapper. */
export type OwnerRegistrationValues = z.output<typeof ownerRegistrationSchema>;
