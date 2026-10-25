"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Notice } from "@/shared/ui/feedback/Notice";
import { MAX_MESSAGE_LENGTH } from "../../../lib/constants";
import { conversationPath } from "../../../lib/conversationPaths";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import { useStartConversationMessage } from "../../../hooks/useConversationMutations";

const copy = conversationsCopy.listingContact;

export interface ListingMessageContactProps {
  listingId: string;
  accountId: string;
  recipientName: string;
}

function ChatBubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="m8 12 2.5 2 5-5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

/** Contato dentro do anúncio: só abre a conversa depois que a primeira mensagem foi confirmada pela API. */
export function ListingMessageContact({ listingId, accountId, recipientName }: ListingMessageContactProps) {
  const router = useRouter();
  const startAndSend = useStartConversationMessage(accountId);
  const sendingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [failed, setFailed] = useState(false);

  const text = body.trim();
  const tooLong = text.length > MAX_MESSAGE_LENGTH;
  const isSending = startAndSend.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text || tooLong || sendingRef.current) return;
    sendingRef.current = true;
    setFailed(false);
    try {
      const conversation = await startAndSend.mutateAsync({ listingId, body: text });
      router.push(conversationPath(conversation.id));
    } catch {
      setFailed(true);
    } finally {
      sendingRef.current = false;
    }
  };

  if (!expanded) {
    return (
      <Button
        variant="outlined"
        fullWidth
        startIcon={<ChatBubbleIcon />}
        onClick={() => setExpanded(true)}
        sx={{
          minHeight: 52,
          justifyContent: "flex-start",
          px: 2,
          borderWidth: 2,
          borderRadius: `${quintalRadii.control}px`,
          boxShadow: hardShadow(3),
          "&:hover": { borderWidth: 2 },
        }}
      >
        {copy.open}
      </Button>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSending}
      sx={{
        p: 2,
        bgcolor: "quintal.cartao",
        border: "2px solid",
        borderColor: "text.primary",
        borderRadius: `${quintalRadii.media}px`,
        boxShadow: hardShadow(3),
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ChatBubbleIcon />
          <Typography component="h2" sx={{ fontWeight: 800 }}>
            {copy.heading(recipientName)}
          </Typography>
        </Stack>
        <TextField
          autoFocus
          multiline
          minRows={2}
          maxRows={5}
          fullWidth
          label={copy.label(recipientName)}
          placeholder={copy.placeholder(recipientName)}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={isSending}
          error={tooLong}
          helperText={tooLong ? copy.tooLong : `${text.length}/${MAX_MESSAGE_LENGTH}`}
        />
        {failed && <Notice tone="erro" title={copy.failed} />}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          startIcon={<SendIcon />}
          disabled={!text || tooLong || isSending}
          sx={{ minHeight: 48, boxShadow: hardShadow(3) }}
        >
          {isSending ? copy.sending : copy.send}
        </Button>
      </Stack>
    </Box>
  );
}
