import { Suspense, use } from "react";
import { act, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { ConversationsShell, ConversationLoading } from "./ConversationsShell";

const route = vi.hoisted(() => ({ params: {} as { conversationId?: string } }));
vi.mock("next/navigation", () => ({ useParams: () => route.params }));
vi.mock("@/features/conversations/index.client", () => ({
  MyConversations: ({ selectedId }: { selectedId?: string }) => (
    <button aria-current={selectedId ? "page" : undefined}>Contato</button>
  ),
}));

it("mantém a mesma lista durante o carregamento e após abrir a conversa", async () => {
  let resolve!: (value: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  function PendingRoom() {
    return <p>{use(pending)}</p>;
  }
  const view = renderWithProviders(
    <ConversationsShell accountId="a1" viewer="owner">
      {null}
    </ConversationsShell>,
    { theme: quintalTheme },
  );
  const contact = screen.getByRole("button", { name: "Contato" });
  route.params = { conversationId: "conversation-a" };
  await act(async () => {
    view.rerender(
      <ConversationsShell accountId="a1" viewer="owner">
        <Suspense fallback={<ConversationLoading />}>
          <PendingRoom />
        </Suspense>
      </ConversationsShell>,
    );
  });
  expect(screen.getByRole("status")).toHaveTextContent("conversa");
  expect(screen.getByRole("button", { name: "Contato" })).toBe(contact);
  expect(contact).toHaveAttribute("aria-current", "page");
  await act(async () => {
    resolve("Conversa carregada");
    await pending;
  });
  expect(await screen.findByText("Conversa carregada")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Contato" })).toBe(contact);
  route.params = {};
  view.rerender(
    <ConversationsShell accountId="a1" viewer="owner">
      {null}
    </ConversationsShell>,
  );
  expect(screen.getByRole("heading", { name: "Escolha uma conversa" })).toBeInTheDocument();
  expect(contact).not.toHaveAttribute("aria-current");
});
