import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import {
  CIDA_CONVERSATION_ID,
  CONVERSATIONS_NOW,
  conversationDto,
  messageDto,
  previewMessageDtos,
  previewStay,
} from "@/test/fixtures/conversations";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ConversationRoom } from "./ConversationRoom";

const ACCOUNT = "account-1";
const path = `*/api/conversations/${CIDA_CONVERSATION_ID}`;

/** A API simulada da conversa da Dona Cida; devolve quantas vezes marcou como lida. */
function api() {
  const reads = { count: 0 };
  server.use(
    http.get(path, () => HttpResponse.json(apiOk(conversationDto()))),
    http.get(`${path}/messages`, () =>
      HttpResponse.json(apiOk({ items: previewMessageDtos(), pageSize: 50, hasMore: false })),
    ),
    http.put(`${path}/read-marker`, () => {
      reads.count += 1;
      return HttpResponse.json(apiOk({ total: 0 }));
    }),
    http.get("*/api/conversations/me", () =>
      HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 50, totalCount: 0 })),
    ),
    http.get("*/api/conversations/me/unread-count", () => HttpResponse.json(apiOk({ total: 0 }))),
  );
  return reads;
}

function setup() {
  return renderWithProviders(
    <div style={{ height: 800 }}>
      <ConversationRoom accountId={ACCOUNT} viewer="owner" conversationId={CIDA_CONVERSATION_ID} stay={previewStay} />
    </div>,
    { theme: quintalTheme },
  );
}

describe("ConversationRoom", () => {
  it("REQ-CHAT-004 abre a conversa da API com as mensagens e a estadia, e marca como lidas", async () => {
    const reads = api();
    setup();
    expect(screen.getByRole("status")).toHaveTextContent("Abrindo a conversa");
    expect(await screen.findByRole("region", { name: "Dona Cida" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByText("Hoje tem jogo e vai ter rojão. Já separei a toalha dela no banheiro."),
    ).toBeInTheDocument();
    expect(screen.getByText("Casa da Dona Cida · Jd. Alvorada")).toBeInTheDocument();
    await waitFor(() => expect(reads.count).toBe(1));
  });

  it("REQ-CHAT-008 envia e a mensagem aparece na conversa", async () => {
    api();
    const sent = messageDto({ sentBy: "owner", body: "Boa noite!", createdAt: CONVERSATIONS_NOW.toISOString() });
    server.use(http.post(`${path}/messages`, () => HttpResponse.json(apiOk(sent), { status: 201 })));
    const { user } = setup();

    await user.type(await screen.findByRole("textbox", { name: "Mensagem para Dona Cida" }), "Boa noite!{Enter}");

    expect(await screen.findByText("Boa noite!")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mensagem para Dona Cida" })).toHaveValue("");
  });

  it("REQ-CHAT-010 envio recusado: a frase da PetHost aparece e o texto fica no campo", async () => {
    api();
    server.use(
      http.post(`${path}/messages`, () => HttpResponse.json(apiFail("CONVERSATION_BLOCKED"), { status: 422 })),
    );
    const { user } = setup();
    const field = await screen.findByRole("textbox", { name: "Mensagem para Dona Cida" });

    await user.type(field, "Oi{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Essa conversa está bloqueada");
    expect(field).toHaveValue("Oi");
  });

  it("REQ-CHAT-002 conversa que não abre: erro com tentar de novo", async () => {
    api();
    server.use(http.get(path, () => HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 500 })));
    setup();
    expect(await screen.findByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
