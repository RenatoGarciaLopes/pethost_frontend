"use client";
import { Button, Link, Stack, Typography, SvgIcon } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { bookingQueries } from "@/features/bookings/index.client";
import { conversationPath, conversationQueries, conversationsCopy, CONVERSATIONS_PATH } from "@/features/conversations";
import { UnreadBadge, useConversationPolling } from "@/features/conversations/index.client";
import { translateError } from "@/shared/api/errors/translateError";
import { Notice } from "@/shared/ui/feedback/Notice";

import { HostConversation } from "./HostConversation";

const copy = conversationsCopy.booking;

/** Compõe reserva e conversa sem imports entre features. A busca do anfitrião cobre as 50 conversas mais recentes.
 * Requer QueryClient da conta; componha junto da outra pessoa no cabeçalho da reserva.
 * @example <BookingConversation accountId={id} bookingId={bookingId} side="owner" />
 */
export function BookingConversation({
  accountId,
  bookingId,
  side,
}: {
  accountId: string;
  bookingId: string;
  side: "owner" | "host";
}) {
  const booking = useQuery(bookingQueries.detail(accountId, bookingId));
  const polling = useConversationPolling(accountId);
  const conversations = useQuery({
    ...conversationQueries.mine(accountId),
    refetchInterval: polling.list,
    enabled: side === "host" && !!booking.data,
  });
  if (!booking.data) return null;
  const data = booking.data;
  const name = side === "owner" ? (data.host?.name ?? copy.host) : (data.owner?.name ?? copy.owner);
  const label = copy.action(name);
  const chatIcon = (
    <SvgIcon aria-hidden="true">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H5.17L4 17.17V4h16Z" />
    </SvgIcon>
  );
  const buttonStyle = {
    alignSelf: "flex-start",
    color: "text.primary",
    borderColor: "text.primary",
    maxWidth: "100%",
    textAlign: "left",
  } as const;
  if (side === "owner") return <HostConversation listingId={data.listingId} hostName={data.host?.name} />;
  if (conversations.isPending) return <Typography role="status">{copy.loading}</Typography>;
  if (conversations.isError)
    return (
      <Notice
        tone="atencao"
        title={translateError(conversations.error)}
        action={<Button onClick={() => void conversations.refetch()}>{copy.retry}</Button>}
      />
    );
  const conversation = conversations.data.find((item) => item.ownerId === data.ownerId);
  if (conversation)
    return (
      <Button
        component={NextLink}
        href={conversationPath(conversation.id)}
        variant="outlined"
        startIcon={chatIcon}
        endIcon={conversation.unreadCount > 0 ? <UnreadBadge count={conversation.unreadCount} /> : undefined}
        sx={{
          ...buttonStyle,
          fontSize: { xs: 14, sm: 16 },
          px: 1.5,
          gap: 1,
          "& .MuiButton-icon": { m: 0 },
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Button>
    );
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        {conversations.data.length < 50 ? copy.empty(name) : copy.outsideRecent(name)}
      </Typography>
      {conversations.data.length >= 50 && (
        <Link component={NextLink} href={CONVERSATIONS_PATH}>
          {copy.viewConversations}
        </Link>
      )}
    </Stack>
  );
}
