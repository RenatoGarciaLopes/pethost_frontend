import type { InfiniteData } from "@tanstack/react-query";
import type { ConversationMessage, MessagePage } from "../types";

/** REST e eventos usam o mesmo merge: preserva cursores e histórico, sem duplicar pelo ID. */
export function withNewMessage<TPageParam>(
  data: InfiniteData<MessagePage, TPageParam> | undefined,
  message: ConversationMessage,
) {
  if (!data?.pages[0] || data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data;
  const [first, ...rest] = data.pages;
  const items = [message, ...first.items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
  );
  return { ...data, pages: [{ ...first, items }, ...rest] };
}
