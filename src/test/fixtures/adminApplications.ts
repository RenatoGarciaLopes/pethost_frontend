import { adminApplicationSchema } from "@/features/admin-host-applications";
/** Dados fictícios para testes/stories do admin. Sem fotos ou documentos reais.
 * @example adminApplicationFixture({ status: "approved" })
 */
export function adminApplicationFixture(overrides: Record<string, unknown> = {}) {
  return adminApplicationSchema.parse({
    id: "0199d2a0-0000-7000-8000-000000000031",
    userId: "0199d2a0-0000-7000-8000-000000000032",
    status: "submitted",
    personType: "pf",
    cpf: "52998224725",
    documentType: "cnh",
    attemptNumber: 1,
    noticeVersion: "v1",
    noticeAcceptedAt: "2026-10-01T12:00:00Z",
    createdAt: "2026-10-01T12:00:00Z",
    submittedAt: "2026-10-02T12:00:00Z",
    documents: ["front", "back", "selfie"].map((kind) => ({
      kind,
      uploadedAt: "2026-10-01T12:00:00Z",
      sizeBytes: 100,
      path: `/api/v1/host-applications/0199d2a0-0000-7000-8000-000000000031/documents/${kind}`,
    })),
    missingDocuments: [],
    user: {
      id: "0199d2a0-0000-7000-8000-000000000032",
      fullName: "Pessoa de teste",
      email: "pessoa@example.test",
      role: "host",
      birthDate: "1990-01-01",
      phone: "11999999999",
      isActive: true,
      createdAt: "2026-10-01T12:00:00Z",
      address: { city: "Maringá", state: "PR" },
    },
    ...overrides,
  });
}
