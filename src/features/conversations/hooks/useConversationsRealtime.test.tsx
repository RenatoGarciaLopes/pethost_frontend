import { act, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { conversationQueries } from "../api/queries";
import { useConversationPolling } from "./useConversationsRealtime";

function Probe() {
  const polling = useConversationPolling("account");
  return <output>{`${polling.thread}:${polling.list}`}</output>;
}
it("interrompe polling após conexão e restaura os intervalos quando ela cai", async () => {
  const { queryClient } = renderWithProviders(<Probe />);
  expect(screen.getByRole("status")).toHaveTextContent("5000:15000");
  act(() => {
    queryClient.setQueryData(conversationQueries.realtime("account"), true);
  });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("false:false"));
  act(() => {
    queryClient.setQueryData(conversationQueries.realtime("account"), false);
  });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("5000:15000"));
});
