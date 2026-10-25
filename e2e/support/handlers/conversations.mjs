import { http } from "msw";
import { publicListing } from "./listingPage.mjs";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const CONVERSATION_ID = "0199d2a0-0000-7000-8000-000000000046";
const conversations = new Map();
let messageSequence = 0;

const conversationKey = (ownerId, hostId) => `${ownerId}:${hostId}`;

function conversationFor(owner, listing) {
  const key = conversationKey(owner.id, listing.hostId);
  let conversation = conversations.get(key);
  if (!conversation) {
    conversation = {
      id: CONVERSATION_ID,
      ownerId: owner.id,
      owner: { id: owner.id, name: owner.fullName, avatarUrl: null },
      hostId: listing.hostId,
      host: { id: listing.hostId, name: listing.host.name, avatarUrl: null },
      lastMessage: null,
      unreadCount: 0,
      blocked: false,
      blockedByMe: false,
      blockedByModeration: false,
      lastMessageAt: null,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    conversations.set(key, conversation);
  }
  return conversation;
}

function visibleConversation(conversation) {
  const dto = { ...conversation };
  delete dto.messages;
  return structuredClone(dto);
}

export function resetConversations() {
  conversations.clear();
  messageSequence = 0;
}

export const conversationsHandlers = [
  http.post(`${API}/conversations`, async ({ request }) => {
    const owner = sessionUserOf(request);
    if (!owner) return fail(401, "UNAUTHORIZED");
    if (owner.role !== "owner") return fail(403, "FORBIDDEN");
    const body = await request.json().catch(() => ({}));
    const listing = publicListing(body?.listingId);
    if (!listing) return fail(404, "CONVERSATION_LISTING_NOT_FOUND");
    const conversation = conversationFor(owner, listing);
    return ok(visibleConversation(conversation), { status: conversation.lastMessage ? 200 : 201 });
  }),
  http.get(`${API}/conversations/me`, ({ request }) => {
    const owner = sessionUserOf(request);
    if (!owner) return fail(401, "UNAUTHORIZED");
    const items = [...conversations.values()]
      .filter((conversation) => conversation.ownerId === owner.id || conversation.hostId === owner.id)
      .map(visibleConversation);
    return ok({ items, page: 1, pageSize: 50, totalCount: items.length });
  }),
  http.get(`${API}/conversations/me/unread-count`, ({ request }) => {
    if (!sessionUserOf(request)) return fail(401, "UNAUTHORIZED");
    return ok({ total: 0 });
  }),
  http.get(`${API}/conversations/:conversationId/messages`, ({ request, params }) => {
    const viewer = sessionUserOf(request);
    if (!viewer) return fail(401, "UNAUTHORIZED");
    const conversation = [...conversations.values()].find((item) => item.id === params.conversationId);
    if (!conversation || (conversation.ownerId !== viewer.id && conversation.hostId !== viewer.id))
      return fail(404, "CONVERSATION_NOT_FOUND");
    return ok({ items: structuredClone(conversation.messages).reverse(), pageSize: 50, hasMore: false });
  }),
  http.post(`${API}/conversations/:conversationId/messages`, async ({ request, params }) => {
    const viewer = sessionUserOf(request);
    if (!viewer) return fail(401, "UNAUTHORIZED");
    const conversation = [...conversations.values()].find((item) => item.id === params.conversationId);
    if (!conversation || (conversation.ownerId !== viewer.id && conversation.hostId !== viewer.id))
      return fail(404, "CONVERSATION_NOT_FOUND");
    const body = await request.json().catch(() => ({}));
    if (typeof body?.body !== "string" || !body.body.trim()) return fail(400, "VALIDATION_ERROR");
    const message = {
      id: `0199d2a0-0000-7000-8000-${String(48 + ++messageSequence).padStart(12, "0")}`,
      conversationId: conversation.id,
      sentBy: viewer.role,
      body: body.body,
      createdAt: new Date().toISOString(),
    };
    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.lastMessageAt = message.createdAt;
    return ok(message, { status: 201 });
  }),
  http.get(`${API}/conversations/:conversationId`, ({ request, params }) => {
    const viewer = sessionUserOf(request);
    if (!viewer) return fail(401, "UNAUTHORIZED");
    const conversation = [...conversations.values()].find((item) => item.id === params.conversationId);
    if (!conversation || (conversation.ownerId !== viewer.id && conversation.hostId !== viewer.id))
      return fail(404, "CONVERSATION_NOT_FOUND");
    return ok(visibleConversation(conversation));
  }),
];
