"use client";

import { Box, Button, CircularProgress, FormHelperText, Stack, Typography } from "@mui/material";
import { useId, useState, type ChangeEvent } from "react";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { validateImageFile } from "../../../lib/files/validateImageFile";
import { photoSlotsCopy as copy } from "./photoSlotsCopy";

export interface PhotoSlotsProps {
  /** Nome do grupo para o leitor de tela (ex.: "Fotos de Pipoca"). */
  label: string;
  /** Uma posição por vaga, na ordem; a primeira é a capa. `null` = vaga livre. */
  files: readonly (File | null)[];
  /** Erro de cada vaga vindo de fora (foto repetida, falha do envio), já em português. */
  errors?: readonly (string | null | undefined)[];
  /** Vaga sendo enviada agora: indicador e botões travados. */
  uploadingIndex?: number | null;
  /** Arquivo já conferido (tipo e tamanho); quem usa decide o resto (repetida, envio). */
  onPick: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

/**
 * Vagas de foto com capa, prévia e erro por vaga (spec 021, REQ-PNEW-007). Controlado e sem HTTP: confere tipo
 * e tamanho (`validateImageFile`) antes de entregar o arquivo e recusa na própria vaga. Arquivos e prévias ficam
 * só em memória (object URL revogado). Reutilizável em fotos do pet (022), documentos (030) e fotos da casa (044).
 *
 * @example <PhotoSlots label="Fotos de Pipoca" files={photos} onPick={pick} onRemove={remove} />
 */
export function PhotoSlots({
  label,
  files,
  errors = [],
  uploadingIndex = null,
  onPick,
  onRemove,
  disabled = false,
}: PhotoSlotsProps) {
  const [invalid, setInvalid] = useState<readonly boolean[]>(() => files.map(() => false));

  function pick(index: number, file: File) {
    const ok = validateImageFile(file).ok;
    setInvalid((current) => current.map((value, slot) => (slot === index ? !ok : value)));
    if (ok) onPick(index, file);
  }

  return (
    <Box
      role="group"
      aria-label={label}
      sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(3, 120px)" } }}
    >
      {files.map((file, index) => (
        <Slot
          key={index}
          index={index}
          file={file}
          error={invalid[index] ? copy.invalid : (errors[index] ?? null)}
          uploading={uploadingIndex === index}
          disabled={disabled || uploadingIndex !== null}
          onPick={(picked) => pick(index, picked)}
          onRemove={() => {
            setInvalid((current) => current.map((value, slot) => (slot === index ? false : value)));
            onRemove(index);
          }}
        />
      ))}
    </Box>
  );
}

interface SlotProps {
  index: number;
  file: File | null;
  error: string | null;
  uploading: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}

function Slot({ index, file, error, uploading, disabled, onPick, onRemove }: SlotProps) {
  const id = useId();
  const preview = useObjectUrl(file);
  const number = index + 1;
  const errorId = `${id}-erro`;

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (picked && !disabled) onPick(picked);
  }

  return (
    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: "1",
          borderRadius: 3,
          border: 2,
          borderStyle: preview ? "solid" : "dashed",
          borderColor: error ? "error.main" : "divider",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.paper",
          "&:focus-within": { outline: "2px solid", outlineColor: "text.primary", outlineOffset: 3 },
        }}
        aria-busy={uploading || undefined}
      >
        {index === 0 && (
          <Typography
            component="span"
            variant="caption"
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              px: 1,
              borderRadius: 1,
              bgcolor: "quintal.gema",
              fontWeight: 700,
              zIndex: 1,
            }}
          >
            {copy.cover}
          </Typography>
        )}
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt={copy.preview(number)}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <>
            <Box
              component="label"
              htmlFor={id}
              sx={{ px: 1, textAlign: "center", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer" }}
            >
              {copy.add(number)}
            </Box>
            <Box
              component="input"
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={choose}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? true : undefined}
              sx={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
            />
          </>
        )}
        {uploading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.6)",
            }}
          >
            <CircularProgress size={28} aria-label={copy.uploading} />
          </Box>
        )}
      </Box>
      {preview && (
        <Button size="small" variant="text" onClick={onRemove} disabled={disabled}>
          {copy.remove(number)}
        </Button>
      )}
      {error && (
        <FormHelperText id={errorId} role="alert" error sx={{ m: 0 }}>
          {error}
        </FormHelperText>
      )}
    </Stack>
  );
}
