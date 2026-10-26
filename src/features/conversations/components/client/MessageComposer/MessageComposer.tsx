"use client";

import { Box, Button, IconButton, InputBase, Typography } from "@mui/material";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { IMAGE_RULES, validateImageFile } from "@/shared/lib/files/validateImageFile";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { MAX_MESSAGE_LENGTH } from "../../../lib/constants";
import { conversationsCopy } from "../../../lib/conversationsCopy";
import type { ComposedMessage } from "../../../types";

const copy = conversationsCopy.composer;
const photoErrors = { type: copy.photoType, size: copy.photoSize, empty: copy.photoEmpty } as const;

export interface MessageComposerProps {
  /** Nome de quem vai receber: entra no rótulo e no texto de apoio ("Escreve pra Dona Cida…"). */
  recipientName: string;
  /** Envia. Texto sem foto vai para `POST .../messages`; com foto, para `.../messages/photo` com a legenda. */
  onSend: (message: ComposedMessage) => unknown;
  /** Enquanto envia, o botão espera e o campo segura o texto. */
  isSending?: boolean;
}

/** A foto escolhida e o endereço local da prévia (sem `createObjectURL`, como em testes, fica sem prévia). */
interface PickedPhoto {
  file: File;
  previewUrl: string | null;
}

const pickPhoto = (file: File): PickedPhoto => ({
  file,
  previewUrl: typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null,
});

const revokePreview = (photo: PickedPhoto | null) => {
  if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
};

/** Ícone de câmera, desenhado em traço de tinta. Decorativo: o nome está no botão. */
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/**
 * O campo de mensagem da conversa (spec 055, REQ-CHAT-008 e 009): câmera para escolher uma foto (JPG, PNG ou WebP até
 * 5 MB, conferida antes de sair), o texto (até 2.000 caracteres; vira legenda quando há foto) e "Enviar". Enter envia;
 * Shift+Enter quebra a linha. Texto só de espaços não sai.
 *
 * Use no pé do painel da conversa. Não use quando a conversa está bloqueada: aí entra o aviso no lugar.
 *
 * @example <MessageComposer recipientName="Dona Cida" onSend={({ body, photo }) => send(body, photo)} />
 */
export function MessageComposer({ recipientName, onSend, isSending = false }: MessageComposerProps) {
  const fieldId = useId();
  const errorId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // A prévia é um endereço local da foto; some quando a foto troca, sai ou o campo desmonta.
  useEffect(() => () => revokePreview(photo), [photo]);

  const text = body.trim();
  const tooLong = text.length > MAX_MESSAGE_LENGTH;
  const canSend = !isSending && !tooLong && (text.length > 0 || photo !== null);
  const error = tooLong ? copy.tooLong(MAX_MESSAGE_LENGTH.toLocaleString("pt-BR")) : photoError;

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    // Se o envio falhar, o texto e a foto ficam no campo; quem envia mostra o erro (`sendError` do painel).
    const sent = await Promise.resolve(onSend({ body: text, photo: photo?.file ?? null })).then(
      () => true,
      () => false,
    );
    if (!sent) return;
    setBody("");
    setPhoto(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSubmit();
  };

  const handlePhoto = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    const result = validateImageFile(file, IMAGE_RULES);
    setPhotoError(result.ok ? null : photoErrors[result.reason]);
    setPhoto(result.ok ? pickPhoto(file) : null);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ borderTop: "2px solid", borderColor: "text.primary", px: { xs: 1.5, md: 2 }, py: 1.5 }}
    >
      {photo && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          {photo.previewUrl && (
            <Box
              component="img"
              src={photo.previewUrl}
              alt=""
              sx={{
                width: 56,
                height: 56,
                objectFit: "cover",
                border: "2px solid",
                borderColor: "text.primary",
                borderRadius: `${quintalRadii.control}px`,
              }}
            />
          )}
          <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, overflowWrap: "anywhere" }}>
            {photo.file.name}
          </Typography>
          <Button variant="quiet" onClick={() => setPhoto(null)}>
            {copy.removePhoto}
          </Button>
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <IconButton
          onClick={() => fileInput.current?.click()}
          aria-label={copy.photo}
          disabled={isSending}
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            color: "text.primary",
            bgcolor: "quintal.cartao",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: `${quintalRadii.control}px`,
            "&:hover": { bgcolor: "quintal.luz" },
          }}
        >
          <CameraIcon />
        </IconButton>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_RULES.types.join(",")}
          hidden
          tabIndex={-1}
          onChange={(event) => handlePhoto(event.target.files?.[0])}
        />
        <Box component="label" htmlFor={fieldId} sx={visuallyHidden}>
          {copy.label(recipientName)}
        </Box>
        <InputBase
          id={fieldId}
          multiline
          maxRows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.placeholder(recipientName)}
          inputProps={{ "aria-invalid": tooLong || undefined, "aria-describedby": error ? errorId : undefined }}
          sx={{
            flexGrow: 1,
            minHeight: 48,
            px: 2,
            py: 1,
            bgcolor: "background.paper",
            border: "2px solid",
            borderColor: tooLong ? "error.main" : "text.primary",
            borderRadius: `${quintalRadii.field}px`,
            "&.Mui-focused": { outline: "3px solid", outlineColor: "quintal.foco", outlineOffset: "2px" },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSending}
          sx={{ minHeight: 48, flexShrink: 0, px: { xs: 2, md: 3 }, boxShadow: hardShadow(3) }}
        >
          {isSending ? copy.sending : copy.send}
        </Button>
      </Box>
      {error && (
        <Typography id={errorId} role="alert" variant="body2" sx={{ color: "error.main", mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
