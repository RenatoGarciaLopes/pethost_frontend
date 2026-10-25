import { hostOnboardingCopy as copy } from "./hostOnboardingCopy";

/** Onde o anfitrião está no caminho: verificação, recebimento (`GET /hosts/me`) e cantinho. */
export interface HostProgress {
  verified: boolean;
  /** Recebimento: `null` antes da verificação (ainda não há perfil de anfitrião). */
  payouts: { enabled: boolean; status: string } | null;
  /** Há ao menos um cantinho aberto (isActive), não apenas cadastrado. */
  hasListing: boolean;
}

export type StageState = keyof typeof copy.states;

export interface HostStage {
  title: string;
  state: StageState;
  text: string;
  /** O que fazer agora (só na etapa da vez). */
  action?: { href: string; label: string };
}

/**
 * As três etapas com a situação real (REQ-HVER-001, REQ-LIST-001): cada uma só abre quando a anterior termina; a da
 * vez traz o caminho; a travada diz o que falta. O recebimento vem do perfil do anfitrião, sem depender da feature do
 * Stripe (043).
 *
 * @example hostStages({ verified: true, payouts: { enabled: false, status: "in_progress" }, hasListing: false })
 */
export function hostStages({ verified, payouts, hasListing }: HostProgress): HostStage[] {
  const { verification, payout, listing } = copy.stages;
  const payoutsEnabled = Boolean(payouts?.enabled);
  return [
    verified
      ? { title: verification.title, state: "done", text: verification.done }
      : {
          title: verification.title,
          state: "current",
          text: verification.current,
          action: { href: "/host/application", label: verification.action },
        },
    !verified
      ? { title: payout.title, state: "locked", text: payout.locked }
      : payoutsEnabled
        ? { title: payout.title, state: "done", text: payout.done }
        : {
            title: payout.title,
            state: "current",
            text: payout.byStatus[payouts?.status ?? ""] ?? payout.fallback,
            action: { href: "/host/payments", label: payout.action },
          },
    !payoutsEnabled
      ? { title: listing.title, state: "locked", text: listing.locked }
      : hasListing
        ? { title: listing.title, state: "done", text: listing.done }
        : {
            title: listing.title,
            state: "current",
            text: listing.current,
            action: { href: "/host/listings/new", label: listing.action },
          },
  ];
}
