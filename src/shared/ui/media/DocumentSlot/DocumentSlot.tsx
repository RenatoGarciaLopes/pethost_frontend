"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, ButtonBase, FormHelperText, Stack, Typography } from "@mui/material";
import { useId, useRef, type ChangeEvent, type ReactNode } from "react";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { visuallyHidden } from "../../a11y/visuallyHidden";
import { documentSlotCopy as copy } from "./documentSlotCopy";

export interface DocumentSlotProps {
  /** Nome da vaga ("Foto da frente do documento"). Abre o nome do botão, seguido da ação visível. */
  label: string;
  /** O que se espera na foto; descreve o botão. */
  hint: string;
  /** Desenho do que se espera (decorativo: o texto já diz). */
  illustration: ReactNode;
  /** Câmera que a vaga abre no celular: traseira (`environment`) para documento, frontal (`user`) para selfie. */
  camera: "environment" | "user";
  /** Foto escolhida agora, só em memória; a miniatura usa object URL revogado ao trocar ou sair. */
  file: File | null;
  /** Já está no servidor (a imagem nunca volta): mostra "Enviada ✓" quando não há foto nova. */
  uploaded?: boolean;
  /** Erro da vaga, já em português (preparo da foto ou recusa da API). */
  error?: string | null;
  /** Foto sendo preparada: botões travados. */
  busy?: boolean;
  disabled?: boolean;
  /** Arquivo como veio do navegador; quem usa prepara (`prepareImageForUpload`) e decide o resto. */
  onPick: (file: File) => void;
}

/**
 * Uma vaga grande de foto de documento (spec 030, REQ-HVER-006/018): o desenho do que se espera, a dica, a
 * miniatura da foto escolhida e "Tirar de novo". A vaga é um botão que abre a câmera certa, com o nome
 * igual ao texto que se vê ("Foto da frente do documento Tirar foto"), para quem usa comando de voz; "Escolher da galeria" aceita foto já tirada. Controlada e sem HTTP; a foto fica só
 * em memória.
 *
 * Quando usar: foto única com orientação do que tirar (documento, selfie, comprovante). Quando não usar: várias
 * fotos de um mesmo assunto, com capa (use `PhotoSlots`), ou foto de perfil (use `AvatarUploader`).
 *
 * @example
 * <DocumentSlot label="Foto da frente do documento" hint="O documento inteiro" illustration={<FrontDrawing />}
 *   camera="environment" file={files.front} error={errors.front} onPick={(file) => pick("front", file)} />
 */
export function DocumentSlot({
  label,
  hint,
  illustration,
  camera,
  file,
  uploaded = false,
  error = null,
  busy = false,
  disabled = false,
  onPick,
}: DocumentSlotProps) {
  const id = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);
  const blocked = disabled || busy;
  const hintId = `${id}-dica`;
  const errorId = `${id}-erro`;

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (picked && !blocked) onPick(picked);
  }

  const input = (ref: typeof cameraRef, inputLabel: string, capture?: DocumentSlotProps["camera"]) => (
    <Box
      component="input"
      ref={ref}
      type="file"
      accept="image/*"
      capture={capture}
      aria-label={inputLabel}
      aria-hidden="true"
      tabIndex={-1}
      disabled={blocked}
      onChange={choose}
      sx={visuallyHidden}
    />
  );

  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <ButtonBase
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-busy={busy || undefined}
        disabled={blocked}
        onClick={() => cameraRef.current?.click()}
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 1.5,
          p: 2,
          width: "100%",
          textAlign: "left",
          borderRadius: `${quintalRadii.card}px`,
          border: "2px solid",
          borderStyle: file || uploaded ? "solid" : "dashed",
          borderColor: error ? "error.main" : theme.palette.quintal.tinta,
          bgcolor: "background.paper",
          "&.Mui-focusVisible": { outline: `3px solid ${theme.palette.quintal.foco}`, outlineOffset: 3 },
          "&.Mui-disabled": { opacity: 0.7 },
        })}
      >
        <Box
          sx={{
            aspectRatio: "3 / 2",
            borderRadius: `${quintalRadii.control}px`,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            bgcolor: "background.default",
          }}
        >
          {preview ? (
            <Box
              component="img"
              src={preview}
              // Decorativa: a ação ao lado ("Tirar de novo") já diz que há foto, e o nome do botão fica limpo.
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box aria-hidden="true" sx={{ width: "70%", maxWidth: 220, "& svg": { width: "100%", height: "auto" } }}>
              {illustration}
            </Box>
          )}
        </Box>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>{" "}
        <Typography component="span" sx={{ fontWeight: 700, color: "text.secondary" }}>
          {busy ? copy.preparing : file ? copy.retake : uploaded ? copy.uploaded : copy.take}
        </Typography>
      </ButtonBase>
      <Typography id={hintId} variant="body2" color="text.secondary">
        {hint}
      </Typography>
      <Box>
        <Button variant="quiet" size="small" disabled={blocked} onClick={() => galleryRef.current?.click()}>
          {copy.gallery}
        </Button>
      </Box>
      {input(cameraRef, copy.cameraInput(label), camera)}
      {input(galleryRef, copy.galleryInput(label))}
      {error && (
        <FormHelperText id={errorId} role="alert" error sx={{ m: 0 }}>
          {error}
        </FormHelperText>
      )}
    </Stack>
  );
}
