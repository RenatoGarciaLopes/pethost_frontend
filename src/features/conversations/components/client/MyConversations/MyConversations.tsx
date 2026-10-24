"use client";

import { Skeleton, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { translateError } from "@/shared/api/errors/translateError";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { conversationQueries } from "../../../api/queries";
import { conversationPath } from "../../../lib/conversationPaths";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import type { ConversationSide } from "../../../types";
import { ConversationList } from "../ConversationList";

export interface MyConversationsProps {
  /** Conta da sessão: separa o cache de cada conta. */
  accountId: string;
  /** De que lado está quem vê (o papel da sessão). */
  viewer: ConversationSide;
  /** Conversa aberta agora. */
  selectedId?: string;
}

/**
 * As conversas da conta vindas da API (spec 055, REQ-CHAT-001 a 003), atualizadas sozinhas de tempos em tempos:
 * carregando, erro com "Tentar de novo" ou a lista.
 *
 * Use na coluna da esquerda de Conversas. Para mostrar uma lista já carregada (stories, testes), use `ConversationList`.
 *
 * @example <MyConversations accountId={user.id} viewer={user.role} selectedId={conversationId} />
 */
export function MyConversations({ accountId, viewer, selectedId }: MyConversationsProps) {
  const query = useQuery(conversationQueries.mine(accountId));
  if (query.isPending)
    return (
      <Stack spacing={1} role="status" aria-label={conversationsCopy.loadingList}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  if (query.isError)
    return (
      <ErrorState
        title={conversationsCopy.listLoadError}
        description={translateError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <ConversationList conversations={query.data} viewer={viewer} selectedId={selectedId} hrefOf={conversationPath} />
  );
}
