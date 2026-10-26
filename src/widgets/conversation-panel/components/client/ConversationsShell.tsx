"use client";

import { Box } from "@mui/material";
import { conversationsCopy } from "@/features/conversations";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import type { ConversationSide } from "@/features/conversations";
import { MyConversations } from "@/features/conversations/index.client";
import { ConversationsLayout } from "../server/ConversationsLayout";

/** Casca persistente: a rota atualiza seleção e painel sem remontar a lista. */
export function ConversationsShell({
  accountId,
  viewer,
  children,
}: {
  accountId: string;
  viewer: ConversationSide;
  children: ReactNode;
}) {
  const { conversationId } = useParams<{ conversationId?: string }>();
  return (
    <ConversationsLayout
      focus={conversationId ? "panel" : "list"}
      list={<MyConversations accountId={accountId} viewer={viewer} selectedId={conversationId} />}
      panel={conversationId ? children : undefined}
    />
  );
}

export function ConversationLoading() {
  return (
    <Box
      sx={{
        height: "100%",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: `${quintalRadii.card}px`,
      }}
    >
      <SniffLoader label={conversationsCopy.loadingConversation} scale={1} />
    </Box>
  );
}
