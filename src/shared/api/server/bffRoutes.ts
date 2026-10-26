import type { HttpMethod } from "../transport/HttpTransport";

export interface BffRoute {
  method: HttpMethod;
  /** Caminho da API sem o prefixo, com `{param}` para um segmento. */
  pattern: string;
}

const route = (method: HttpMethod, pattern: string): BffRoute => ({ method, pattern });

/**
 * Rotas que devolvem tokens. Atendidas pelos handlers de sessão (`app/api/...`), que gravam os cookies;
 * o proxy **nunca** as repassa, senão os tokens chegariam ao navegador (REQ-HTTP-007).
 */
export const sessionOnlyRoutes: readonly BffRoute[] = [
  route("POST", "/auth/sessions/login"),
  route("POST", "/auth/sessions/refresh"),
  route("POST", "/auth/sessions/logout"),
  route("POST", "/auth/sessions/switch"),
  route("POST", "/users/register"),
  route("POST", "/users/me/password"),
  route("POST", "/owners/register"),
  route("POST", "/owners/reactivate"),
  route("POST", "/hosts/reactivate"),
];

/**
 * Rotas que o navegador nunca chama: quem chama é outro serviço direto na API (o Stripe manda os eventos para o
 * webhook). Ficam fora do proxy de propósito; o teste de contrato confere que nada foi esquecido.
 */
export const apiOnlyRoutes: readonly BffRoute[] = [route("POST", "/stripe/webhooks")];

export interface DeniedRoute extends BffRoute {
  /** Por que a rota está fora do proxy (e o que a traz de volta). */
  reason: string;
}

const denied = (method: HttpMethod, pattern: string, reason: string): DeniedRoute => ({ method, pattern, reason });

const adminNoScreen = "Só admin e nenhuma tela de admin a usa; entra na lista junto com a tela.";
const reviewsNoScreen = "Avaliações: a tela de avaliar (spec 056) ainda não existe; entra na lista junto com ela.";
const publicReviewsNoScreen =
  "Leitura pública de avaliações sem tela no navegador (a página do cantinho lê `GET /reviews` no servidor, sem o proxy).";

/**
 * Operações da API que existem e que o app **ainda não usa** pelo navegador. Ficam fora do proxy de propósito
 * (404), cada uma com o motivo, e o teste de contrato confere que nada foi esquecido. Quando uma tela passar a
 * chamar a rota, ela sai daqui e entra em `bffRoutes` na mesma entrega.
 */
export const deniedRoutes: readonly DeniedRoute[] = [
  denied("PUT", "/owners/me/avatar", "Multipart API compatibility only; this frontend uses direct signed uploads."),
  denied("PUT", "/hosts/me/avatar", "Multipart API compatibility only; this frontend uses direct signed uploads."),
  denied(
    "PUT",
    "/hosts/me/application/documents",
    "Multipart API compatibility only; this frontend uses direct signed uploads.",
  ),
  denied(
    "POST",
    "/listings/{listingId}/photos",
    "Multipart API compatibility only; this frontend uses direct signed uploads.",
  ),
  denied(
    "PATCH",
    "/listings/{listingId}/photos/{photoId}",
    "Multipart API compatibility only; this frontend uses direct signed uploads.",
  ),
  denied("POST", "/pets/{petId}/photos", "Multipart API compatibility only; this frontend uses direct signed uploads."),
  denied(
    "PATCH",
    "/pets/{petId}/photos/{photoId}",
    "Multipart API compatibility only; this frontend uses direct signed uploads.",
  ),
  denied(
    "POST",
    "/conversations/{conversationId}/messages/photo",
    "Multipart API compatibility only; this frontend uses direct signed uploads.",
  ),
  denied("GET", "/payments/payouts/me", "Ganhos do anfitrião ainda não tem tela consumidora."),
  denied("GET", "/payments/issues", adminNoScreen),
  // Admin
  denied("GET", "/bookings", adminNoScreen),
  denied("POST", "/host-applications/identity-blocks/release", adminNoScreen),
  denied("GET", "/reviews/reports", adminNoScreen),
  denied("GET", "/reviews/reports/{reportId}", adminNoScreen),
  denied("PUT", "/reviews/reports/{reportId}/resolution", adminNoScreen),
  denied("PUT", "/reviews/{reviewId}/moderation-hide", adminNoScreen),
  denied("DELETE", "/reviews/{reviewId}/moderation-hide", adminNoScreen),

  // Anfitrião e tutor
  denied("GET", "/hosts/me/dashboard", "O painel do anfitrião ainda lê pedidos e cantinhos pelas rotas que já usa."),
  denied(
    "POST",
    "/hosts/me/deletion",
    'Exclusão de conta (LGPD): a tela de conta só tem "pausar"; entra com a tela de excluir.',
  ),
  denied(
    "POST",
    "/owners/me/deletion",
    'Exclusão de conta (LGPD): a tela de conta só tem "pausar"; entra com a tela de excluir.',
  ),

  // Avaliações
  denied("POST", "/reviews", reviewsNoScreen),
  denied("GET", "/reviews/me", reviewsNoScreen),
  denied("GET", "/reviews/me/received", reviewsNoScreen),
  denied("GET", "/reviews/{reviewId}", reviewsNoScreen),
  denied("PATCH", "/reviews/{reviewId}", reviewsNoScreen),
  denied("DELETE", "/reviews/{reviewId}", reviewsNoScreen),
  denied("PUT", "/reviews/{reviewId}/reply", reviewsNoScreen),
  denied("DELETE", "/reviews/{reviewId}/reply", reviewsNoScreen),
  denied("POST", "/reviews/{reviewId}/report", reviewsNoScreen),
  denied("GET", "/reviews", publicReviewsNoScreen),
  denied("GET", "/reviews/summary", publicReviewsNoScreen),
  denied("GET", "/owners/{ownerId}/reviews", publicReviewsNoScreen),
  denied("GET", "/owners/{ownerId}/reviews/summary", publicReviewsNoScreen),
  denied("GET", "/pets/{petId}/reviews", publicReviewsNoScreen),
  denied("GET", "/pets/{petId}/reviews/summary", publicReviewsNoScreen),
];

/**
 * Lista permitida do proxy `app/api/[...path]` (REQ-HTTP-009). O que não está aqui responde 404.
 * Papéis não são conferidos no BFF: a API é a autoridade de autorização (evita duas regras divergentes).
 * O teste `bffRoutes.test.ts` confere a lista contra o OpenAPI versionado; toda operação da API está aqui, em
 * `sessionOnlyRoutes`, em `apiOnlyRoutes` ou em `deniedRoutes` (com o motivo).
 */
export const bffRoutes: readonly BffRoute[] = [
  // Conta e senha
  route("GET", "/users/me"),
  route("GET", "/users/me/accounts"),
  route("POST", "/auth/password/forgot"),
  route("POST", "/auth/password/reset"),

  // Tutor
  route("GET", "/owners/me"),
  route("PATCH", "/owners/me"),
  route("DELETE", "/owners/me/avatar"),
  route("POST", "/owners/me/deactivate"),

  // Anfitrião
  route("GET", "/hosts/me"),
  route("PATCH", "/hosts/me"),
  route("DELETE", "/hosts/me/avatar"),
  route("POST", "/hosts/me/deactivate"),
  route("GET", "/hosts/me/application"),
  route("POST", "/hosts/me/application"),
  route("PATCH", "/hosts/me/application"),
  route("DELETE", "/hosts/me/application"),
  route("POST", "/hosts/me/application/submission"),
  route("GET", "/hosts/{hostId}/pets"),
  route("GET", "/hosts/me/stripe-account"),
  route("POST", "/hosts/me/stripe-account/onboarding-session"),
  route("POST", "/hosts/me/stripe-account/onboarding-link"),
  route("POST", "/hosts/me/stripe-account/synchronization"),

  // Cantinhos (listings)
  route("POST", "/listings"),
  route("GET", "/listings"),
  route("GET", "/listings/me"),
  route("GET", "/listings/{listingId}"),
  route("PATCH", "/listings/{listingId}"),
  route("POST", "/listings/{listingId}/deactivation"),
  route("DELETE", "/listings/{listingId}/deactivation"),
  route("PUT", "/listings/{listingId}/photos/order"),
  route("DELETE", "/listings/{listingId}/photos/{photoId}"),
  route("GET", "/listings/{listingId}/compatibility"),
  route("GET", "/listings/{listingId}/availability-blocks"),
  route("POST", "/listings/{listingId}/availability-blocks"),
  route("DELETE", "/listings/{listingId}/availability-blocks/{blockId}"),

  // Estadias (bookings)
  route("POST", "/bookings"),
  route("GET", "/bookings/me"),
  route("GET", "/bookings/{bookingId}"),
  route("POST", "/bookings/{bookingId}/acceptance"),
  route("POST", "/bookings/{bookingId}/refusal"),
  route("POST", "/bookings/{bookingId}/cancellation"),
  route("POST", "/bookings/{bookingId}/check-in"),
  route("POST", "/bookings/{bookingId}/check-out"),

  // Pagamento da reserva e ganhos do anfitrião (payments)
  route("GET", "/bookings/{bookingId}/payment"),
  route("PUT", "/bookings/{bookingId}/payment"),
  route("POST", "/bookings/{bookingId}/payment/installments/{installmentNumber}/payment-session"),
  route("POST", "/bookings/{bookingId}/payment/synchronization"),

  // Conversas (a escrita é REST; o aviso em tempo real é o hub, fora do proxy)
  route("POST", "/conversations"),
  route("POST", "/uploads"),
  route("POST", "/uploads/documents/confirm"),
  route("POST", "/uploads/{uploadId}/confirm"),
  route("GET", "/conversations/{conversationId}/messages/{messageId}/photo"),
  route("GET", "/conversations/me"),
  route("GET", "/conversations/me/unread-count"),
  route("GET", "/conversations/me/notification-settings"),
  route("PUT", "/conversations/me/notification-settings"),
  route("GET", "/conversations/{conversationId}"),
  route("GET", "/conversations/{conversationId}/messages"),
  route("POST", "/conversations/{conversationId}/messages"),
  route("POST", "/conversations/{conversationId}/messages/{messageId}/report"),
  route("PUT", "/conversations/{conversationId}/read-marker"),
  route("PUT", "/conversations/{conversationId}/block"),
  route("DELETE", "/conversations/{conversationId}/block"),

  // Contato do suporte (público)
  route("GET", "/support"),

  // Pets
  route("POST", "/pets"),
  route("GET", "/pets/me"),
  route("GET", "/pets/{petId}"),
  route("PATCH", "/pets/{petId}"),
  route("POST", "/pets/{petId}/deactivation"),
  route("DELETE", "/pets/{petId}/deactivation"),
  route("DELETE", "/pets/{petId}/photos/{photoId}"),
  route("PUT", "/pets/{petId}/photos/order"),

  // Admin
  route("GET", "/audit-entries"),
  route("GET", "/hosts"),
  route("GET", "/hosts/{hostId}"),
  route("POST", "/hosts/{hostId}/suspension"),
  route("DELETE", "/hosts/{hostId}/suspension"),
  route("POST", "/hosts/{hostId}/identity-release"),
  route("POST", "/hosts/{hostId}/stripe-account-reset"),
  route("GET", "/host-applications"),
  route("GET", "/host-applications/{applicationId}"),
  route("GET", "/host-applications/{applicationId}/documents/{kind}"),
  route("POST", "/host-applications/{applicationId}/approval"),
  route("POST", "/host-applications/{applicationId}/rejection"),
  route("GET", "/owners"),
  route("GET", "/owners/{ownerId}"),
  route("POST", "/owners/{ownerId}/suspension"),
  route("DELETE", "/owners/{ownerId}/suspension"),
  route("POST", "/owners/{ownerId}/cpf-release"),
  route("GET", "/conversations/reports"),
  route("GET", "/conversations/reports/{reportId}"),
  route("PUT", "/conversations/reports/{reportId}/resolution"),
  route("DELETE", "/conversations/{conversationId}/moderation-block"),
];

/** Parâmetro de rota: ids e palavras simples. Recusa `..`, espaço e barra codificada. */
const PARAM_SEGMENT = /^[A-Za-z0-9_-]+$/;

const compiled = bffRoutes.map((entry) => ({ entry, segments: entry.pattern.split("/").slice(1) }));

/**
 * Procura a rota permitida para `method` + `path` (sem o prefixo da API).
 * @returns a rota, ou `undefined` (o proxy responde 404).
 */
export function matchBffRoute(method: string, path: string): BffRoute | undefined {
  const upper = method.toUpperCase();
  const parts = path.split("/").slice(1);

  return compiled.find(
    ({ entry, segments }) =>
      entry.method === upper &&
      segments.length === parts.length &&
      segments.every((segment, index) =>
        segment.startsWith("{") ? PARAM_SEGMENT.test(parts[index]!) : segment === parts[index],
      ),
  )?.entry;
}
