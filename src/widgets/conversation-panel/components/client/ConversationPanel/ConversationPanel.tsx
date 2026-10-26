"use client";

import { Box } from "@mui/material";
import { useState } from "react";
import {
  blockedNotice,
  otherParty,
  otherPartyName,
  type ComposedMessage,
  type Conversation,
  type ConversationMessage,
  type ConversationSide,
} from "@/features/conversations";
import { ConversationHeader, MessageComposer, MessageThread } from "@/features/conversations/index.client";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { Notice } from "@/shared/ui/feedback/Notice";
import { Surface } from "@/shared/ui/layout/Surface";
import { stayBanner, stayDayPill, stayEvents, staySubtitle, type ConversationStay } from "../../../lib/stayContext";
import { StayBanner } from "../../server/StayBanner";

export interface ConversationPanelProps {
  conversation: Conversation;
  /** De que lado está quem vê (o papel da sessão). */
  viewer: ConversationSide;
  /** Mensagens carregadas, em qualquer ordem. */
  messages: readonly ConversationMessage[];
  /** A estadia entre os dois lados, quando há: dá o cantinho no cabeçalho, o dia, a faixa e a chegada. */
  stay?: ConversationStay | null;
  /** Há mensagens mais antigas na API. */
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** Envia o texto ou a foto com legenda. */
  onSend: (message: ComposedMessage) => unknown;
  isSending?: boolean;
  /** O que deu errado no último envio (frase da PetHost); o texto continua no campo. */
  sendError?: string | null;
  /** Volta para a lista no celular. */
  backHref: string;
  /** "Agora" para os dias e o dia da estadia; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * A conversa aberta com o contexto da estadia (spec 055): cabeçalho com quem está do outro lado e o cantinho, o selo
 * "Pipoca aqui · dia 2 de 5" e a faixa da estadia em andamento, as mensagens com a chegada no meio e, no pé, o campo
 * de mensagem ou o aviso de conversa bloqueada (REQ-CHAT-010). No computador é um cartão com sombra dura; no celular
 * ocupa a tela inteira.
 *
 * Use na coluna da direita de Conversas. Não use sem a conversa carregada (a página mostra o carregando antes).
 *
 * @example <ConversationPanel conversation={conversation} viewer="owner" messages={page.items} stay={stay} onSend={send} backHref="/conversations" />
 */
export function ConversationPanel({
  conversation,
  viewer,
  messages,
  stay,
  hasMore,
  isLoadingOlder,
  onLoadOlder,
  onSend,
  isSending,
  sendError,
  backHref,
  now,
}: ConversationPanelProps) {
  const [moment] = useState(() => now ?? new Date());
  const name = otherPartyName(conversation, viewer);
  const dayPill = stay ? stayDayPill(stay, moment) : null;
  const banner = stay ? stayBanner(stay) : null;
  const notice = blockedNotice(conversation);

  return (
    <Surface
      component="section"
      elevation="lg"
      aria-label={name}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
        // No celular a conversa é a tela inteira: sem contorno, canto ou sombra.
        borderWidth: { xs: 0, md: 2 },
        borderRadius: { xs: 0, md: `${quintalRadii.card}px` },
        boxShadow: { xs: "none", md: hardShadow(8) },
      }}
    >
      <ConversationHeader
        name={name}
        avatarUrl={otherParty(conversation, viewer)?.avatarUrl ?? null}
        subtitle={stay ? staySubtitle(stay) : undefined}
        aside={dayPill ? <StatusPill tone="info" label={dayPill} /> : undefined}
        backHref={backHref}
      />
      {banner && <StayBanner status={banner.status} text={banner.text} />}
      <MessageThread
        messages={messages}
        viewer={viewer}
        otherName={name}
        events={stay ? stayEvents(stay) : []}
        hasMore={hasMore}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={onLoadOlder}
        now={moment}
      />
      {notice ? (
        <Box sx={{ borderTop: "2px solid", borderColor: "text.primary", p: 2 }}>
          <Notice tone="info" title={notice} />
        </Box>
      ) : (
        <>
          {sendError && (
            <Box sx={{ borderTop: "2px solid", borderColor: "text.primary", px: 2, pt: 2 }}>
              <Notice tone="erro" title={sendError} />
            </Box>
          )}
          <MessageComposer recipientName={name} onSend={onSend} isSending={isSending} />
        </>
      )}
    </Surface>
  );
}
