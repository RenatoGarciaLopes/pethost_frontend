import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1HostsMeStripeAccountResponse,
  PostApiV1HostsMeStripeAccountOnboardingSessionResponse,
  PostApiV1HostsMeStripeAccountOnboardingLinkResponse,
} from "@/shared/api/generated/host-stripe-account/host-stripe-account.zod";
/** O OpenAPI descreve status livre; o domínio também implementa rejected. @example payoutStatusSchema.parse("enabled") */
export const payoutStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "under_review",
  "restricted",
  "enabled",
  "rejected",
]);
/** DTO gerado estreitado na borda. @example stripeAccountSchema.parse(data) */
export const stripeAccountSchema = unwrapData(GetApiV1HostsMeStripeAccountResponse).extend({
  status: payoutStatusSchema,
});
/** Sessão efêmera: apenas closure de EmbeddedOnboarding, nunca query/mutation cache. @example onboardingSessionSchema.parse(data) */
export const onboardingSessionSchema = unwrapData(PostApiV1HostsMeStripeAccountOnboardingSessionResponse).extend({
  clientSecret: z.string().min(1),
  publishableKey: z.string().min(1),
  account: stripeAccountSchema,
});
/** Link efêmero aceito apenas no domínio de onboarding Stripe via HTTPS. @example onboardingLinkSchema.parse(data) */
export const onboardingLinkSchema = unwrapData(PostApiV1HostsMeStripeAccountOnboardingLinkResponse).extend({
  url: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "connect.stripe.com" && !url.username && !url.password;
    }),
  account: stripeAccountSchema,
});
/** DTO validado anterior ao mapper. @example const dto: StripeAccountDto = stripeAccountSchema.parse(data); */
export type StripeAccountDto = z.output<typeof stripeAccountSchema>;
/** DTO efêmero da sessão. @example const session: OnboardingSessionDto = onboardingSessionSchema.parse(data); */
export type OnboardingSessionDto = z.output<typeof onboardingSessionSchema>;
/** DTO efêmero da alternativa hospedada. @example const link: OnboardingLinkDto = onboardingLinkSchema.parse(data); */
export type OnboardingLinkDto = z.output<typeof onboardingLinkSchema>;
