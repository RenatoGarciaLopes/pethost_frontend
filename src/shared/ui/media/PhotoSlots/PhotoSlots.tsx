"use client";

import { keyboardFocus } from "@/shared/theme/focus";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, CircularProgress, FormHelperText, Stack, Typography } from "@mui/material";
import { useId, useState, type ChangeEvent } from "react";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { validateImageFile } from "../../../lib/files/validateImageFile";
import { visuallyHidden } from "../../a11y/visuallyHidden";
import { photoSlotsCopy as copy } from "./photoSlotsCopy";

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";
/** No computador, até 5 vagas lado a lado. */
const MAX_COLUMNS = 5;

export interface PhotoSlotsProps {
  /** Nome do grupo para o leitor de tela (ex.: "Fotos de Pipoca"). */
  label: string;
  /**
   * Uma posição por vaga, na ordem; a primeira é a capa. `null` = vaga livre; `File` = escolhida agora (prévia em
   * memória); `string` = URL de foto já salva, mostrada direto.
   */
  files: readonly (File | string | null)[];
  /** Erro de cada vaga vindo de fora (foto repetida, falha do envio), já em português. */
  errors?: readonly (string | null | undefined)[];
  /** Vaga sendo enviada agora: indicador e botões travados. */
  uploadingIndex?: number | null;
  /** Arquivo já conferido (tipo e tamanho); quem usa decide o resto (repetida, envio). */
  onPick: (index: number, file: File) => void;
  /**
   * Troca da foto de uma vaga preenchida, com a mesma conferência de `onPick`. Se vier, cada vaga preenchida mostra
   * "Trocar foto N"; sem ele, não há troca (o cadastro da 021 não usa).
   */
  onReplace?: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  /**
   * Reordenar (spec 044, REQ-LIST-014): se vier, cada foto ganha "Usar como capa" e "Mover a foto N para cima/baixo",
   * por botão (nunca só arrastando). Recebe a posição de origem e a de destino.
   */
  onMove?: (from: number, to: number) => void;
  disabled?: boolean;
}

/**
 * Vagas de foto com capa, prévia e erro por vaga (spec 021, REQ-PNEW-007). Controlado e sem HTTP: confere tipo
 * e tamanho (`validateImageFile`) antes de entregar o arquivo e recusa na própria vaga. Arquivos e prévias ficam
 * só em memória (object URL revogado). Mostra fotos já salvas (URL) e, com `onReplace`, oferece a troca na mesma
 * vaga (spec 022, REQ-PEDIT-008). Reutilizável em fotos do pet (021, 022), documentos (030) e fotos da casa (044).
 *
 * @example <PhotoSlots label="Fotos de Pipoca" files={photos} onPick={pick} onRemove={remove} />
 * @example <PhotoSlots label="Fotos de Thor" files={pet.photoUrls} onPick={add} onReplace={replace} onRemove={remove} />
 */
export function PhotoSlots({
  label,
  files,
  errors = [],
  uploadingIndex = null,
  onPick,
  onReplace,
  onRemove,
  onMove,
  disabled = false,
}: PhotoSlotsProps) {
  const lastFilled = files.findLastIndex((file) => file !== null);
  const [invalid, setInvalid] = useState<readonly boolean[]>(() => files.map(() => false));

  function markInvalid(index: number, value: boolean) {
    setInvalid((current) => current.map((item, slot) => (slot === index ? value : item)));
  }

  /** Confere o arquivo e só entrega se servir; o erro fica na vaga. */
  function deliverChecked(index: number, deliver: (index: number, file: File) => void) {
    return (file: File) => {
      const ok = validateImageFile(file).ok;
      markInvalid(index, !ok);
      if (ok) deliver(index, file);
    };
  }

  return (
    <Box
      role="group"
      aria-label={label}
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "repeat(3, minmax(0, 1fr))",
          sm: `repeat(${Math.min(files.length, MAX_COLUMNS)}, 120px)`,
        },
      }}
    >
      {files.map((file, index) => (
        <Slot
          key={index}
          index={index}
          file={file}
          error={invalid[index] ? copy.invalid : (errors[index] ?? null)}
          uploading={uploadingIndex === index}
          disabled={disabled || uploadingIndex !== null}
          onPick={deliverChecked(index, onPick)}
          onReplace={onReplace && deliverChecked(index, onReplace)}
          onRemove={() => {
            markInvalid(index, false);
            onRemove(index);
          }}
          moves={
            onMove && file !== null
              ? {
                  cover: index > 0 ? () => onMove(index, 0) : undefined,
                  up: index > 0 ? () => onMove(index, index - 1) : undefined,
                  down: index < lastFilled ? () => onMove(index, index + 1) : undefined,
                }
              : undefined
          }
        />
      ))}
    </Box>
  );
}

interface SlotProps {
  index: number;
  file: File | string | null;
  error: string | null;
  uploading: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
  onReplace?: (file: File) => void;
  onRemove: () => void;
  /** Reordenar a foto desta vaga (só com `onMove`). */
  moves?: { cover?: () => void; up?: () => void; down?: () => void };
}

function Slot({ index, file, error, uploading, disabled, onPick, onReplace, onRemove, moves }: SlotProps) {
  const id = useId();
  const objectUrl = useObjectUrl(file instanceof File ? file : null);
  const preview = typeof file === "string" ? file : objectUrl;
  const number = index + 1;
  const errorId = `${id}-erro`;

  function fileInputProps(deliver: (file: File) => void) {
    return {
      type: "file",
      accept: ACCEPTED_IMAGES,
      disabled,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const picked = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (picked && !disabled) deliver(picked);
      },
      "aria-describedby": error ? errorId : undefined,
      "aria-invalid": error ? true : undefined,
    };
  }

  return (
    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: "1",
          borderRadius: `${quintalRadii.card}px`,
          border: 2,
          borderStyle: preview ? "solid" : "dashed",
          borderColor: error ? "error.main" : "divider",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.paper",
          [keyboardFocus("&:has(input:focus-visible)")]: {
            outline: "2px solid",
            outlineColor: "text.primary",
            outlineOffset: 3,
          },
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
              borderRadius: `${quintalRadii.control}px`,
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
            alt={typeof file === "string" ? copy.saved(number) : copy.preview(number)}
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
              {...fileInputProps(onPick)}
              sx={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
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
      {preview && onReplace && (
        <Box
          component="label"
          sx={{
            minHeight: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: `${quintalRadii.control}px`,
            fontWeight: 700,
            fontSize: "0.8125rem",
            textAlign: "center",
            color: disabled ? "text.disabled" : "text.primary",
            cursor: disabled ? "not-allowed" : "pointer",
            [keyboardFocus("&:has(input:focus-visible)")]: {
              outline: "2px solid",
              outlineColor: "text.primary",
              outlineOffset: 2,
            },
          }}
        >
          {copy.replace(number)}
          <Box component="input" {...fileInputProps(onReplace)} sx={visuallyHidden} />
        </Box>
      )}
      {preview && (
        <Button size="small" variant="text" onClick={onRemove} disabled={disabled} sx={{ minHeight: 48 }}>
          {copy.remove(number)}
        </Button>
      )}
      {preview && moves && (
        <Stack spacing={0.25}>
          {moves.cover && (
            <Button size="small" variant="text" onClick={moves.cover} disabled={disabled}>
              {copy.makeCover}
              <Box component="span" sx={visuallyHidden}>
                {copy.makeCoverOf(number)}
              </Box>
            </Button>
          )}
          {moves.up && (
            <Button size="small" variant="text" onClick={moves.up} disabled={disabled}>
              {copy.moveUp(number)}
            </Button>
          )}
          {moves.down && (
            <Button size="small" variant="text" onClick={moves.down} disabled={disabled}>
              {copy.moveDown(number)}
            </Button>
          )}
        </Stack>
      )}
      {error && (
        <FormHelperText id={errorId} role="alert" error sx={{ m: 0 }}>
          {error}
        </FormHelperText>
      )}
    </Stack>
  );
}
