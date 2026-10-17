"use client";
import { useEffect, useEffectEvent, useId, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Surface } from "@/shared/ui/layout/Surface";
import { Notice } from "@/shared/ui/feedback/Notice";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { adminReviewCopy as copy } from "@/features/admin-host-applications";
const MAX_TIMEOUT_MS = 2_147_483_647;

interface SignedDocumentViewerProps {
  label: string;
  /** Desenho do que se espera na foto (decorativo): o cartão mostra o desenho, nunca a foto, até a abertura explícita. */
  illustration: ReactNode;
  /** Não busque antes de abrir; respeite o signal para cancelar ao fechar. */
  load: (signal: AbortSignal) => Promise<{ url: string; expiresAt: number }>;
}
/** Cartão com o desenho da vaga que abre a foto temporária, somente em memória local, descartada ao fechar, vencer ou
 * falhar. Não usa Query, storage ou prefetch; o servidor de imagens deve responder no-store.
 * @example <SignedDocumentViewer label="Frente" illustration={documentDrawings.front} load={signal => getDocumentLink(id, "front", undefined, signal)} />
 */
export function SignedDocumentViewer({ label, illustration, load }: SignedDocumentViewerProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState<{ url: string; expiresAt: number } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const requestPhoto = useEffectEvent(load);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void requestPhoto(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        const seconds = Math.max(0, Math.ceil(value.expiresAt - Date.now() / 1000));
        setRemaining(seconds);
        setPhoto(seconds > 0 ? value : null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, attempt]);
  useEffect(() => {
    if (!photo) return;
    const expiryTimer = setTimeout(
      () => {
        if (Date.now() >= photo.expiresAt * 1000) {
          setRemaining(0);
          setPhoto(null);
        }
      },
      Math.min(MAX_TIMEOUT_MS, Math.max(0, photo.expiresAt * 1000 - Date.now())),
    );
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil(photo.expiresAt - Date.now() / 1000));
      setRemaining(seconds);
      if (seconds === 0) setPhoto(null);
    }, 250);
    return () => {
      clearInterval(timer);
      clearTimeout(expiryTimer);
    };
  }, [photo]);
  function close() {
    setOpen(false);
    setPhoto(null);
    setError(null);
  }
  function start() {
    setLoading(true);
    setPhoto(null);
    setError(null);
    setOpen(true);
    setAttempt((value) => value + 1);
  }
  return (
    <>
      <Surface
        component={ButtonBase}
        interactive
        onClick={start}
        aria-label={`${copy.open}: ${label}`}
        sx={{
          display: "grid",
          gap: 1,
          p: { xs: 1, sm: 1.5 },
          width: "100%",
          justifyItems: "stretch",
          textAlign: "left",
        }}
      >
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            display: "grid",
            placeItems: "center",
            aspectRatio: "3 / 2",
            p: { xs: 1, sm: 2 },
            borderRadius: `${quintalRadii.media}px`,
            bgcolor: alpha(theme.palette.ceu.main, 0.25),
            color: "text.primary",
            "& svg": { width: "100%", height: "100%" },
          })}
        >
          {illustration}
        </Box>
        <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: "0.85rem", sm: "1rem" }, lineHeight: 1.3 }}>
          {label}
        </Typography>
      </Surface>
      <Dialog open={open} onClose={close} aria-labelledby={titleId} maxWidth="md" fullWidth>
        <DialogTitle id={titleId}>{label}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Skeleton variant="rectangular" height={260} aria-label={copy.loading} />
          ) : error ? (
            <Notice tone="erro">{getErrorMessage(error)}</Notice>
          ) : photo ? (
            <>
              <Typography role="status">
                {copy.expires} {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </Typography>
              <Box
                component="img"
                src={photo.url}
                alt={label}
                referrerPolicy="no-referrer"
                onError={() => setPhoto(null)}
                sx={{ display: "block", maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", mx: "auto" }}
              />
            </>
          ) : (
            <Typography role="status">{copy.expired}</Typography>
          )}
          {!loading && !photo && <Button onClick={start}>{copy.reopen}</Button>}
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={close}>
            {copy.close}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
