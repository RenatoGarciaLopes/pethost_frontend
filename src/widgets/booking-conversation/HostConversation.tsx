"use client";

import { Button, Stack, SvgIcon } from "@mui/material";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { conversationPath, conversationsCopy } from "@/features/conversations";
import { openConversation } from "@/features/conversations/index.client";
import { translateError } from "@/shared/api/errors/translateError";
import { Notice } from "@/shared/ui/feedback/Notice";

/** Ação do tutor para abrir ou reutilizar a conversa do cantinho, antes ou depois da reserva. */
export function HostConversation({ listingId, hostName }: { listingId: string; hostName?: string | null }) {
  const router = useRouter();
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function open() {
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      const conversation = await openConversation(listingId);
      router.push(conversationPath(conversation.id));
    } catch (failure) {
      setError(failure);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <Stack spacing={1}>
      <Button
        type="button"
        variant="outlined"
        loading={pending}
        onClick={() => void open()}
        startIcon={
          <SvgIcon aria-hidden="true">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H5.17L4 17.17V4h16Z" />
          </SvgIcon>
        }
        sx={{
          alignSelf: "flex-start",
          color: "text.primary",
          borderColor: "text.primary",
          maxWidth: "100%",
          textAlign: "left",
          overflowWrap: "anywhere",
        }}
      >
        {conversationsCopy.booking.action(hostName?.trim() || conversationsCopy.booking.host)}
      </Button>
      {error != null && <Notice tone="atencao" title={translateError(error)} />}
    </Stack>
  );
}
