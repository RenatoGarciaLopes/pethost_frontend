import { adminOwnerSchema } from "@/features/owners";
import { adminHostSchema } from "@/features/hosts";
const timestamp = "2026-10-01T12:00:00Z";
const user = { id: "0199d2a0-0000-7000-8000-000000004201", fullName: "João de teste", email: "joao@example.test", phone: "11999999999", birthDate: "1990-01-01", address: { city: "Maringá", state: "PR" }, isActive: true, createdAt: timestamp };
/** Tutor fictício validado para testes e stories; overrides só em memória.
 * @example adminOwnerFixture({ cpf: null })
 */
export function adminOwnerFixture(overrides: Record<string, unknown> = {}) {
  return adminOwnerSchema.parse({ id: "0199d2a0-0000-7000-8000-000000003201", userId: user.id, cpf: "52998224725", isActive: true, createdAt: timestamp, user: { ...user, role: "owner" }, ...overrides });
}
/** Anfitrião fictício com cadastro de recebimento; não contém conta Stripe real.
 * @example adminHostFixture({ stripeStatus: "rejected" })
 */
export function adminHostFixture(overrides: Record<string, unknown> = {}) {
  return adminHostSchema.parse({ id: "0199d2a0-0000-7000-8000-000000003202", userId: "0199d2a0-0000-7000-8000-000000004202", cpf: "11144477735", personType: "pf", verifiedAt: timestamp, isActive: true, stripeConnected: true, stripePayoutsEnabled: false, stripeStatus: "in_progress", createdAt: timestamp, user: { ...user, id: "0199d2a0-0000-7000-8000-000000004202", role: "host" }, ...overrides });
}
