"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  FormHelperText,
  Stack,
} from "@mui/material";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { validateImageFile } from "../../../lib/files/validateImageFile";
import { initialsOf } from "../../../lib/text/initials";
import { avatarUploaderCopy as copy } from "./avatarUploaderCopy";

export interface AvatarUploaderProps {
  /** Nome para as iniciais quando não há foto. */
  name: string;
  /** Foto atual; mudar a URL limpa seleção/prévia e confirmação. */
  avatarUrl: string | null;
  /** Operação externa em andamento: bloqueia todos os controles. */
  busy: boolean;
  /** Frase já traduzida do erro HTTP, associada ao input nativo. */
  error?: string | null;
  /** Recebe o arquivo validado só após confirmar a prévia; o caller faz HTTP. */
  onUpload: (file: File) => void;
  /** Recebe a confirmação de remoção; o caller faz HTTP e atualiza avatarUrl. */
  onRemove: () => void;
  /** Desliga edição sem ocultar a foto atual. */
  disabled?: boolean;
}
/**
 * Escolha nativa, validação e prévia de avatar (REQ-ACC-014 a 017). File e object URL
 * ficam só em memória. Busy/error/avatarUrl são controlados pelo caller, sem HTTP interno.
 * Use para uma foto de perfil; não faz recorte, galeria, compressão ou progresso numérico.
 * @example <AvatarUploader name={profile.fullName} avatarUrl={profile.avatarUrl} busy={upload.isPending} onUpload={upload.mutate} onRemove={() => remove.mutate()} />
 */
export function AvatarUploader(props: AvatarUploaderProps) {
  return <AvatarPicker key={JSON.stringify(props.avatarUrl)} {...props} />;
}

function AvatarPicker({ name, avatarUrl, busy, error, onUpload, onRemove, disabled = false }: AvatarUploaderProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const previewUrl = useObjectUrl(file);
  const blocked = busy || disabled;
  const message = validationError || error;
  const initials = initialsOf(name);
  const source = previewUrl || avatarUrl;

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selected || blocked) return;
    const result = validateImageFile(selected);
    setValidationError(result.ok ? null : copy.invalid);
    setFile(result.ok ? selected : null);
  }
  function cancelPreview() {
    if (blocked) return;
    setFile(null);
    setValidationError(null);
    inputRef.current?.focus();
  }
  function remove() {
    if (blocked) return;
    setConfirming(false);
    setFile(null);
    setValidationError(null);
    onRemove();
  }
  return (
    <Stack role="group" aria-label={copy.group} aria-busy={busy} spacing={2} sx={{ alignItems: "flex-start" }}>
      <Avatar
        src={source ?? undefined}
        alt={previewUrl ? copy.previewAlt : copy.photoAlt}
        role={!source ? "img" : undefined}
        aria-label={!source ? `${copy.placeholder} ${name}`.trim() : undefined}
        sx={{
          width: 96,
          height: 96,
          bgcolor: "background.paper",
          color: "text.primary",
          border: 1,
          borderColor: "divider",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {initials}
      </Avatar>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          borderRadius: `${quintalRadii.control}px`,
          "&:focus-within": { outline: "2px solid", outlineColor: "text.primary", outlineOffset: 3 },
        }}
      >
        <Button component="label" role={undefined} tabIndex={-1} htmlFor={id} disabled={blocked} variant="outlined">
          {copy.choose}
        </Button>
        <Box
          component="input"
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={blocked}
          onChange={choose}
          aria-describedby={message ? `${id}-error` : undefined}
          aria-invalid={message ? true : undefined}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: blocked ? "not-allowed" : "pointer",
          }}
        />
      </Box>
      {message ? (
        <FormHelperText id={`${id}-error`} role="alert" error sx={{ m: 0 }}>
          {message}
        </FormHelperText>
      ) : null}
      {file ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
          <Button
            type="button"
            variant="contained"
            disabled={blocked}
            onClick={() => {
              if (!blocked) onUpload(file);
            }}
          >
            {copy.use}
          </Button>
          <Button type="button" disabled={blocked} onClick={cancelPreview}>
            {copy.cancel}
          </Button>
        </Stack>
      ) : null}
      {avatarUrl ? (
        <Button type="button" disabled={blocked} onClick={() => setConfirming(true)}>
          {copy.remove}
        </Button>
      ) : null}
      {busy ? <CircularProgress size={24} aria-label={copy.updating} /> : null}
      <Dialog
        open={confirming}
        aria-labelledby={`${id}-confirm`}
        onClose={() => {
          if (!blocked) setConfirming(false);
        }}
      >
        <DialogTitle id={`${id}-confirm`}>{copy.confirmTitle}</DialogTitle>
        <DialogActions>
          <Button type="button" disabled={blocked} onClick={remove}>
            {copy.confirmRemove}
          </Button>
          <Button type="button" autoFocus disabled={blocked} onClick={() => setConfirming(false)}>
            {copy.cancel}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
