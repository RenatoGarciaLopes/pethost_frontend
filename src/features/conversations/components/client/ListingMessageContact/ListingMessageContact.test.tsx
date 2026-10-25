import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { CIDA_CONVERSATION_ID, conversationDto, messageDto } from "@/test/fixtures/conversations";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ListingMessageContact } from "./ListingMessageContact";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const listingId = "0199f0a0-0000-7000-8000-00000000c3a1";

beforeEach(() => push.mockClear());

function setup() {
  return renderWithProviders(
    <ListingMessageContact listingId={listingId} accountId="owner-1" recipientName="Dona Cida" />,
    { theme: quintalTheme },
  );
}

async function openComposer(user: ReturnType<typeof setup>["user"]) {
  await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
}

describe("ListingMessageContact", () => {
  it("só abre o campo no anúncio; não inicia conversa antes do primeiro envio", async () => {
    const start = vi.fn();
    server.use(
      http.post("*/api/conversations", () => {
        start();
        return HttpResponse.json(apiOk(conversationDto()), { status: 201 });
      }),
    );
    const { user } = setup();

    await openComposer(user);

    expect(screen.getByRole("textbox", { name: "Mensagem para Dona Cida" })).toBeVisible();
    expect(start).not.toHaveBeenCalled();
  });

  it("envia primeiro a mensagem e só então navega para a conversa devolvida pelo backend", async () => {
    const requests: string[] = [];
    server.use(
      http.post("*/api/conversations", async ({ request }) => {
        requests.push("start");
        expect(await request.json()).toEqual({ listingId });
        return HttpResponse.json(apiOk(conversationDto({ id: CIDA_CONVERSATION_ID })), { status: 201 });
      }),
      http.post(`*/api/conversations/${CIDA_CONVERSATION_ID}/messages`, async ({ request }) => {
        requests.push("message");
        expect(await request.json()).toEqual({ body: "Ainda tem vaga para a Pipoca?" });
        return HttpResponse.json(apiOk(messageDto({ sentBy: "owner", body: "Ainda tem vaga para a Pipoca?" })), {
          status: 201,
        });
      }),
    );
    const { user } = setup();
    await openComposer(user);
    await user.type(screen.getByRole("textbox", { name: "Mensagem para Dona Cida" }), "  Ainda tem vaga para a Pipoca?  ");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/conversations/${CIDA_CONVERSATION_ID}`));
    expect(requests).toEqual(["start", "message"]);
  });

  it("não envia texto vazio ou só com espaços", async () => {
    const start = vi.fn();
    server.use(
      http.post("*/api/conversations", () => {
        start();
        return HttpResponse.json(apiOk(conversationDto()), { status: 201 });
      }),
    );
    const { user } = setup();
    await openComposer(user);
    const field = screen.getByRole("textbox", { name: "Mensagem para Dona Cida" });

    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    fireEvent.change(field, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    expect(start).not.toHaveBeenCalled();
  });

  it("enquanto envia desabilita o envio duplicado", async () => {
    let finishRequest!: () => void;
    const messageRequest = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });
    const send = vi.fn();
    server.use(
      http.post("*/api/conversations", () => HttpResponse.json(apiOk(conversationDto()), { status: 201 })),
      http.post(`*/api/conversations/${CIDA_CONVERSATION_ID}/messages`, async () => {
        send();
        await messageRequest;
        return HttpResponse.json(apiOk(messageDto({ sentBy: "owner" })), { status: 201 });
      }),
    );
    const { user } = setup();
    await openComposer(user);
    await user.type(screen.getByRole("textbox", { name: "Mensagem para Dona Cida" }), "Oi!");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(send).toHaveBeenCalledTimes(1);
    finishRequest();
  });

  it("se o envio falha, mantém a mensagem para tentar de novo e não redireciona", async () => {
    let starts = 0;
    let sends = 0;
    server.use(
      http.post("*/api/conversations", () =>
        HttpResponse.json(apiOk(conversationDto()), { status: starts++ === 0 ? 201 : 200 }),
      ),
      http.post(`*/api/conversations/${CIDA_CONVERSATION_ID}/messages`, () => {
        sends += 1;
        return sends === 1
          ? HttpResponse.json(apiFail("CONVERSATION_BLOCKED"), { status: 422 })
          : HttpResponse.json(apiOk(messageDto({ sentBy: "owner", body: "Oi, tudo bem?" })), { status: 201 });
      }),
    );
    const { user } = setup();
    await openComposer(user);
    const field = screen.getByRole("textbox", { name: "Mensagem para Dona Cida" });
    await user.type(field, "Oi, tudo bem?");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar a mensagem.");
    expect(field).toHaveValue("Oi, tudo bem?");
    expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/conversations/${CIDA_CONVERSATION_ID}`));
    expect(starts).toBe(2);
    expect(sends).toBe(2);
  });
});
