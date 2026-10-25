import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { CIDA_CONVERSATION_ID, conversationDto, messageDto } from "@/test/fixtures/conversations";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { markConversationRead, sendMessage, sendPhotoMessage, startConversation } from "./conversations.client";

const transport = createBffClient({ baseUrl: "http://localhost/api" });
const path = `*/api/conversations/${CIDA_CONVERSATION_ID}`;

describe("conversations.client", () => {
  it("cria a conversa do anúncio usando o contrato do backend", async () => {
    server.use(
      http.post("*/api/conversations", async ({ request }) => {
        expect(await request.json()).toEqual({ listingId: CIDA_CONVERSATION_ID });
        return HttpResponse.json(apiOk(conversationDto()), { status: 201 });
      }),
    );
    await expect(startConversation(CIDA_CONVERSATION_ID, transport)).resolves.toMatchObject({
      id: CIDA_CONVERSATION_ID,
    });
  });

  it("aceita a conversa existente devolvida pelo backend sem criar outra", async () => {
    server.use(
      http.post("*/api/conversations", () => HttpResponse.json(apiOk(conversationDto()), { status: 200 })),
    );
    await expect(startConversation(CIDA_CONVERSATION_ID, transport)).resolves.toMatchObject({
      id: CIDA_CONVERSATION_ID,
    });
  });

  it("REQ-CHAT-008 texto vai em JSON com o cabeçalho anti-CSRF e volta a mensagem gravada", async () => {
    server.use(
      http.post(`${path}/messages`, async ({ request }) => {
        expect(await request.json()).toEqual({ body: "Oi, Dona Cida!" });
        expect(request.headers.get("x-pethost-request")).toBe("1");
        return HttpResponse.json(apiOk(messageDto({ sentBy: "owner", body: "Oi, Dona Cida!" })), { status: 201 });
      }),
    );
    const message = await sendMessage(CIDA_CONVERSATION_ID, "Oi, Dona Cida!", transport);
    expect(message).toMatchObject({ sentBy: "owner", body: "Oi, Dona Cida!" });
  });

  it("REQ-CHAT-009 foto vai em multipart com a parte file e a legenda em body", async () => {
    server.use(
      http.post(`${path}/messages/photo`, async ({ request }) => {
        const form = await request.formData();
        expect((form.get("file") as File).name).toBe("pipoca.jpg");
        expect(form.get("body")).toBe("Olha ela!");
        return HttpResponse.json(apiOk(messageDto({ sentBy: "owner", imageUrl: "https://bucket/foto.jpg" })), {
          status: 201,
        });
      }),
    );
    const file = new File([new Uint8Array(4)], "pipoca.jpg", { type: "image/jpeg" });
    const message = await sendPhotoMessage(CIDA_CONVERSATION_ID, file, "Olha ela!", transport);
    expect(message.imageUrl).toBe("https://bucket/foto.jpg");
  });

  it("REQ-CHAT-009 foto sem legenda não manda a parte body", async () => {
    server.use(
      http.post(`${path}/messages/photo`, async ({ request }) => {
        expect((await request.formData()).has("body")).toBe(false);
        return HttpResponse.json(apiOk(messageDto({ body: undefined, imageUrl: "https://bucket/foto.jpg" })));
      }),
    );
    const file = new File([new Uint8Array(4)], "pipoca.jpg", { type: "image/jpeg" });
    await sendPhotoMessage(CIDA_CONVERSATION_ID, file, "", transport);
  });

  it("REQ-CHAT-010 conversa bloqueada volta o erro tipado da API", async () => {
    server.use(
      http.post(`${path}/messages`, () => HttpResponse.json(apiFail("CONVERSATION_BLOCKED"), { status: 422 })),
    );
    await expect(sendMessage(CIDA_CONVERSATION_ID, "Oi", transport)).rejects.toMatchObject({
      code: "CONVERSATION_BLOCKED",
      status: 422,
    });
  });

  it("REQ-CHAT-001 marcar como lida é um PUT e devolve o contador novo da conta", async () => {
    server.use(http.put(`${path}/read-marker`, () => HttpResponse.json(apiOk({ total: 3 }))));
    expect(await markConversationRead(CIDA_CONVERSATION_ID, transport)).toBe(3);
  });
});
