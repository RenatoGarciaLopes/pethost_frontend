"use client";

import { Box, Button, ButtonBase, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1ConversationsConversationIdMessagesMessageIdPhotoResponse } from "@/shared/api/generated/conversations/conversations.zod";
import { bffClient } from "@/shared/api/client/bffClient";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
import { PhotoLightbox } from "@/shared/ui/media/PhotoLightbox";
import { conversationsCopy as copy } from "../../../lib/conversationsCopy";
import type { ConversationMessage } from "../../../types";

const linkSchema = unwrapData(GetApiV1ConversationsConversationIdMessagesMessageIdPhotoResponse);

/** A private chat photo renews before expiry and after focus/errors; unmount aborts pending requests. */
export function MessagePhoto({
  message,
  mine,
  otherName,
}: {
  message: ConversationMessage;
  mine: boolean;
  otherName: string;
}) {
  // The image is immutable; a rotated polling signature must not reload the same photo.
  const [initialLink] = useState(() => ({ url: message.imageUrl!, expiresAt: message.imageUrlExpiresAt }));
  const [url, setUrl] = useState(initialLink.url);
  const [expired, setExpired] = useState(
    () => initialLink.expiresAt != null && initialLink.expiresAt * 1000 <= Date.now(),
  );
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const recovered = useRef(false);

  useEffect(() => {
    if (initialLink.expiresAt == null) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let expiresAt = initialLink.expiresAt;
    let pending = false;
    const renew = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const next = await bffClient.request(
          {
            method: "GET",
            path: `/conversations/${encodeURIComponent(message.conversationId)}/messages/${encodeURIComponent(message.id)}/photo`,
            signal: controller.signal,
          },
          linkSchema,
        );
        if (controller.signal.aborted) return;
        setUrl(next.url);
        setExpired(false);
        setFailed(false);
        if (next.expiresAt != null) {
          expiresAt = next.expiresAt;
          timer = setTimeout(() => void renew(), Math.max(1_000, expiresAt * 1000 - Date.now() - 10_000));
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        pending = false;
      }
    };
    const focus = () => {
      if (Date.now() >= expiresAt * 1000 - 10_000) {
        clearTimeout(timer);
        void renew();
      }
    };
    const delay = expiresAt * 1000 - Date.now() - 10_000;
    if (delay <= 0 || attempt > 0) void renew();
    else timer = setTimeout(() => void renew(), delay);
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", focus);
    };
  }, [message.id, message.conversationId, initialLink.expiresAt, attempt]);

  if (failed)
    return (
      <Button
        onClick={() => {
          setFailed(false);
          setAttempt((value) => value + 1);
        }}
      >
        {copy.retryPhoto}
      </Button>
    );
  if (expired) return <Typography role="status">{copy.loadingPhoto}</Typography>;
  return (
    <>
      <ButtonBase
        aria-label={copy.openPhoto}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        sx={{
          display: "block",
          width: "min(340px, 85%)",
          borderRadius: `${quintalRadii.media}px`,
          transform: mine ? "rotate(1deg)" : "rotate(-1deg)",
          mb: 0.75,
          cursor: "zoom-in",
          [keyboardFocus()]: focusRing,
        }}
      >
        <Box
          component="img"
          src={url}
          alt={mine ? copy.photoAlt(copy.you) : copy.photoAlt(otherName)}
          onError={() => {
            if (initialLink.expiresAt != null && !recovered.current) {
              recovered.current = true;
              setAttempt((value) => value + 1);
            } else setFailed(true);
          }}
          sx={{
            display: "block",
            width: "100%",
            aspectRatio: "4 / 3",
            objectFit: "cover",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: `${quintalRadii.media}px`,
            boxShadow: hardShadow(5),
            bgcolor: "quintal.cartao",
          }}
        />
      </ButtonBase>
      {open && (
        <PhotoLightbox
          photos={[{ id: message.id, url }]}
          title={mine ? copy.photoAlt(copy.you) : copy.photoAlt(otherName)}
          initialIndex={0}
          open
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
