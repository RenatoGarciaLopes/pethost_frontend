"use client";

import { Box, Button, Typography } from "@mui/material";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { MessagePhoto } from "./MessagePhoto";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { buildTimeline, type TimelineEvent } from "../../../lib/buildTimeline";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { formatMessageTime } from "../../../lib/messageTime";
import type { ConversationMessage, ConversationSide } from "../../../types";

const copy = conversationsCopy;

export interface MessageThreadProps {
  /** Mensagens carregadas, em qualquer ordem (a API manda da mais nova para a mais antiga). */
  messages: readonly ConversationMessage[];
  /** De que lado está quem vê: as dele ficam à direita. */
  viewer: ConversationSide;
  /** Nome de quem está do outro lado (rótulo da conversa e de cada mensagem para o leitor de tela). */
  otherName: string;
  /** Acontecimentos que entram na linha do tempo (ex.: a chegada do pet), montados por quem conhece a estadia. */
  events?: readonly TimelineEvent[];
  /** Há mensagens mais antigas na API: mostra "Ver mensagens anteriores". */
  hasMore?: boolean;
  /** Enquanto busca as anteriores, o botão espera. */
  isLoadingOlder?: boolean;
  /** Pede a página anterior (cursor `before`, REQ-CHAT-007). */
  onLoadOlder?: () => void;
  /** "Agora" para os títulos dos dias; padrão: o momento da montagem. */
  now?: Date;
}

const bubble = (mine: boolean) => ({
  px: 2,
  py: 1.25,
  maxWidth: "min(560px, 85%)",
  border: "2px solid",
  borderColor: "text.primary",
  borderRadius: `${quintalRadii.field}px`,
  bgcolor: mine ? "quintal.luz" : "background.paper",
  whiteSpace: "pre-wrap" as const,
  overflowWrap: "anywhere" as const,
});

/** Uma mensagem: foto (levemente torta, com sombra dura), texto e a hora. Quem disse vai escondido, para o leitor de tela. */
function MessageItem({ message, mine, otherName }: { message: ConversationMessage; mine: boolean; otherName: string }) {
  const align = mine ? "flex-end" : "flex-start";
  return (
    <Box component="li" sx={{ display: "flex", flexDirection: "column", alignItems: align, gap: 0.75 }}>
      <Box component="span" sx={visuallyHidden}>
        {mine ? copy.youSaid : copy.saidBy(otherName)}
      </Box>
      {message.imageUrl && <MessagePhoto message={message} mine={mine} otherName={otherName} />}
      {message.body && <Box sx={bubble(mine)}>{message.body}</Box>}
      <Typography component="span" sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
      </Typography>
    </Box>
  );
}

/** Um acontecimento da estadia no meio da conversa, como a chegada: selo grama no centro. */
function EventItem({ event }: { event: TimelineEvent }) {
  return (
    <Box component="li" sx={{ display: "flex", justifyContent: "center" }}>
      <Box
        component="span"
        sx={{
          px: 1.5,
          py: 0.25,
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.pill}px`,
          bgcolor: "grama.main",
          fontSize: "0.85rem",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {`${event.label} · ${formatMessageTime(event.at)}`}
      </Box>
    </Box>
  );
}

/**
 * As mensagens da conversa (spec 055, REQ-CHAT-004 a 007): em ordem de leitura, separadas por dia ("Ontem", "Hoje",
 * "8 out"), as de quem vê à direita em gema clara e as do outro lado à esquerda em branco, com a hora embaixo. Foto
 * vem com a legenda logo abaixo. Acontecimentos da estadia entram no momento certo. É a área que rola: abre no fim e
 * desce sozinha quando chega mensagem nova. Não mostra "lida": a API não conta ao remetente se foi lida.
 *
 * Use dentro do painel da conversa, entre o cabeçalho e o campo de mensagem. Não use para a lista de conversas.
 *
 * @example <MessageThread messages={page.items} viewer="owner" otherName="Dona Cida" hasMore onLoadOlder={fetchOlder} />
 */
export function MessageThread({
  messages,
  viewer,
  otherName,
  events = [],
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  now,
}: MessageThreadProps) {
  const [moment] = useState(() => now ?? new Date());
  const scroller = useRef<HTMLDivElement>(null);
  const headingPrefix = useId();
  const days = buildTimeline(messages, events, moment);
  const lastEntry = days.at(-1)?.entries.at(-1);
  const newestId = lastEntry?.kind === "message" ? lastEntry.message.id : lastEntry?.event.id;

  // Abre no fim e desce quando a mensagem mais nova muda; carregar as anteriores não mexe nela.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [newestId]);

  return (
    <Box
      ref={scroller}
      role="log"
      aria-label={copy.threadLabel(otherName)}
      tabIndex={0}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowAnchor: "auto",
        px: { xs: 1.5, md: 2.5 },
        py: 2,
        "&:focus-visible": { outline: "3px solid", outlineColor: "quintal.foco", outlineOffset: "-3px" },
      }}
    >
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button variant="quiet" onClick={onLoadOlder} disabled={isLoadingOlder}>
            {isLoadingOlder ? copy.loadingOlder : copy.loadOlder}
          </Button>
        </Box>
      )}
      {days.map((day) => (
        <Box component="section" key={day.day} aria-labelledby={`${headingPrefix}-${day.day}`} sx={{ mb: 2 }}>
          <Typography
            id={`${headingPrefix}-${day.day}`}
            component="h3"
            variant="overline"
            sx={{ display: "block", textAlign: "center", color: "text.secondary", mb: 1.5 }}
          >
            {day.label}
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2 }}>
            {day.entries.map((entry) =>
              entry.kind === "message" ? (
                <MessageItem
                  key={entry.message.id}
                  message={entry.message}
                  mine={entry.message.sentBy === viewer}
                  otherName={otherName}
                />
              ) : (
                <EventItem key={entry.event.id} event={entry.event} />
              ),
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
