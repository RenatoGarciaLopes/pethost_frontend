"use client";

import { Avatar, Box, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useState } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { UnreadBadge } from "../UnreadBadge";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { lastMessagePreview, otherParty, otherPartyName } from "../../../lib/conversationParties";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { formatListTime } from "../../../lib/messageTime";
import type { Conversation, ConversationSide } from "../../../types";

const copy = conversationsCopy;

export interface ConversationListProps {
  /** Conversas na ordem da API (atividade mais recente primeiro). */
  conversations: readonly Conversation[];
  /** De que lado está quem vê: decide quem aparece em cada linha e o "Você:" da prévia. */
  viewer: ConversationSide;
  /** Conversa aberta agora: ganha o contorno e `aria-current="page"`. */
  selectedId?: string;
  /** Endereço de cada conversa (ex.: `/conversations/{id}`). */
  hrefOf: (conversationId: string) => string;
  /** "Agora" para hora e dia; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * A lista de conversas da conta (spec 055, REQ-CHAT-001 a 003): foto e nome de quem está do outro lado, a última
 * mensagem ("Você:" quando foi quem vê), quando foi e o contador de não lidas. Cada linha é um link; a aberta fica
 * contornada, com sombra dura e `aria-current`. Sem conversas, explica onde elas nascem.
 *
 * Use na coluna da esquerda de Conversas (ou sozinha no celular). Não use para escolher destinatário: só o tutor
 * puxa conversa, a partir do cantinho.
 *
 * @example <ConversationList conversations={items} viewer="owner" selectedId={id} hrefOf={(id) => `/conversations/${id}`} />
 */
export function ConversationList({ conversations, viewer, selectedId, hrefOf, now }: ConversationListProps) {
  const [moment] = useState(() => now ?? new Date());
  if (conversations.length === 0)
    return <EmptyState title={copy.emptyList.title} description={copy.emptyList.description} headingComponent="h2" />;

  return (
    <Box component="ul" aria-label={copy.listLabel} sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
      {conversations.map((conversation) => {
        const selected = conversation.id === selectedId;
        const name = otherPartyName(conversation, viewer);
        const when = conversation.lastMessageAt ?? conversation.lastMessage?.createdAt;
        return (
          <li key={conversation.id}>
            <Link
              component={NextLink}
              href={hrefOf(conversation.id)}
              aria-current={selected ? "page" : undefined}
              underline="none"
              sx={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 1.5,
                minHeight: 72,
                p: 1.25,
                color: "text.primary",
                border: "2px solid",
                borderColor: selected ? "text.primary" : "transparent",
                borderRadius: `${quintalRadii.media}px`,
                bgcolor: selected ? "background.paper" : "transparent",
                boxShadow: selected ? hardShadow(3) : "none",
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <Avatar
                src={otherParty(conversation, viewer)?.avatarUrl ?? undefined}
                alt=""
                sx={{ width: 48, height: 48, border: "2px solid", borderColor: "text.primary", bgcolor: "ceu.main" }}
              >
                {name.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="span" sx={{ display: "block", fontWeight: 700 }}>
                  {name}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    display: "block",
                    color: conversation.unreadCount > 0 ? "text.primary" : "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastMessagePreview(conversation.lastMessage, viewer)}
                </Typography>
              </Box>
              <Box sx={{ display: "grid", justifyItems: "end", gap: 0.5 }}>
                {when && (
                  <Typography component="span" variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {formatListTime(when, moment)}
                  </Typography>
                )}
                {conversation.unreadCount > 0 && <UnreadBadge count={conversation.unreadCount} />}
              </Box>
            </Link>
          </li>
        );
      })}
    </Box>
  );
}
