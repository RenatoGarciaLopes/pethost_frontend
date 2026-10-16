/** DTO sintético do espelho Stripe, sem documento ou conta bancária. @example payoutAccountDto({ status: "enabled", payoutsEnabled: true }); */
export function payoutAccountDto(overrides: Record<string, unknown> = {}) {
  return {
    status: "not_started",
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    listingsVisible: false,
    disabledReason: null,
    syncedAt: null,
    onboardedAt: null,
    ...overrides,
  };
}
