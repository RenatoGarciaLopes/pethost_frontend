"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { alpha, Box, Button, Dialog, Typography, useMediaQuery } from "@mui/material";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";

/** URLs originais da API, já na ordem desejada; não há transformação de resolução. */
export interface PhotoLightboxProps {
  photos: readonly { id: string; url: string }[];
  title: string;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

/** Visualizador de fotos em tela cheia, independente do domínio.
 * Monte por abertura (com key da foto escolhida) para iniciar em initialIndex e limpar os gestos.
 * O Dialog do MUI prende o foco, fecha com Escape e devolve o foco ao botão que abriu.
 * Zoom de 1x a 4x; navegação circular, pinça, arraste limitado e toque duplo.
 */
export function PhotoLightbox({ photos, title, initialIndex, open, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, photos.length - 1)));
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ x: 0, y: 0, distance: 0, scale: 1, panX: 0, panY: 0, moved: false, pinch: false });
  const lastTap = useRef(0);
  const id = useId();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const photo = photos[index];
  const control = {
    minWidth: 48,
    minHeight: 48,
    flexShrink: 0,
    color: "quintal.tinta",
    bgcolor: "quintal.papel",
    border: "2px solid",
    borderColor: "quintal.tinta",
    [keyboardFocus()]: { ...focusRing, outlineColor: quintalColors.gema },
    "&:hover": { bgcolor: "quintal.gema" },
  };

  function update(scale: number, x = view.x, y = view.y) {
    scale = Math.max(1, Math.min(4, scale));
    const bounds = stage.current?.getBoundingClientRect();
    const img = image.current;
    const ratio = img?.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const width = bounds ? Math.min(bounds.width, bounds.height * ratio) : 0;
    const height = width / ratio;
    const maxX = bounds ? Math.max(0, (width * scale - bounds.width) / 2) : 0;
    const maxY = bounds ? Math.max(0, (height * scale - bounds.height) / 2) : 0;
    setView({ scale, x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) });
  }

  function navigate(next: number) {
    setIndex((next + photos.length) % photos.length);
    setView({ scale: 1, x: 0, y: 0 });
    pointers.current.clear();
    lastTap.current = 0;
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      distance: points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0,
      scale: view.scale,
      panX: view.x,
      panY: view.y,
      moved: false,
      pinch: points.length > 1,
    };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (Math.hypot(dx, dy) > 8) g.moved = true;
    const points = [...pointers.current.values()];
    if (points.length > 1 && g.distance > 0) {
      lastTap.current = 0;
      update((g.scale * Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)) / g.distance);
    } else if (!g.pinch && g.scale > 1) update(g.scale, g.panX + dx, g.panY + dy);
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (g.pinch) {
      // Ao soltar um dedo da pinça, o restante passa a arrastar sem saltar.
      const remaining = [...pointers.current.values()][0];
      if (remaining)
        gesture.current = {
          ...g,
          x: remaining.x,
          y: remaining.y,
          panX: view.x,
          panY: view.y,
          scale: view.scale,
          moved: true,
          pinch: false,
        };
      return;
    }
    const dx = event.clientX - g.x;
    if (g.scale === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - g.y))
      navigate(index + (dx < 0 ? 1 : -1));
    else if (!g.moved && event.pointerType === "touch") {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        update(view.scale > 1 ? 1 : 2, 0, 0);
        lastTap.current = 0;
      } else lastTap.current = now;
    }
  }

  if (!photo) return null;
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      aria-labelledby={id}
      transitionDuration={reduced ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          navigate(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: alpha(quintalColors.tinta, 0.97),
            color: "quintal.papel",
            display: "flex",
            overflow: "hidden",
            p: { xs: 1, md: 2 },
            gap: 1,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography id={id} component="h2" sx={{ fontSize: "1.1rem", minWidth: 0, overflowWrap: "anywhere" }}>
          {title}
        </Typography>
        <Button aria-label="Fechar" onClick={onClose} sx={control}>
          ×
        </Button>
      </Box>
      <Typography aria-live="polite" align="center">
        {index + 1} de {photos.length}
      </Typography>
      <Box sx={{ position: "relative", display: "flex", flex: 1, minHeight: 0 }}>
        {photos.length > 1 && (
          <Button
            aria-label="Foto anterior"
            onClick={() => navigate(index - 1)}
            sx={{ ...control, position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
          >
            ←
          </Button>
        )}
        <Box
          ref={stage}
          data-testid="photo-stage"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            pointers.current.clear();
            lastTap.current = 0;
          }}
          onDoubleClick={() => update(view.scale > 1 ? 1 : 2, 0, 0)}
          onWheel={(event) => {
            event.preventDefault();
            update(view.scale + (event.deltaY < 0 ? 0.25 : -0.25));
          }}
          sx={{
            flex: 1,
            height: "100%",
            minWidth: 0,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            touchAction: "none",
            cursor: view.scale > 1 ? "grab" : "zoom-in",
          }}
        >
          <Box
            ref={image}
            component="img"
            src={photo.url}
            alt={`Foto ${index + 1} de ${title}`}
            draggable={false}
            onLoad={() => update(view.scale)}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              userSelect: "none",
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            }}
          />
        </Box>
        {photos.length > 1 && (
          <Button
            aria-label="Próxima foto"
            onClick={() => navigate(index + 1)}
            sx={{ ...control, position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
          >
            →
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
        <Button
          aria-label="Diminuir zoom"
          disabled={view.scale === 1}
          onClick={() => update(view.scale - 0.5)}
          sx={control}
        >
          −
        </Button>
        <Button
          aria-label="Aumentar zoom"
          disabled={view.scale === 4}
          onClick={() => update(view.scale + 0.5)}
          sx={control}
        >
          +
        </Button>
        {view.scale > 1 && (
          <Button onClick={() => update(1, 0, 0)} sx={control}>
            Voltar ao tamanho
          </Button>
        )}
      </Box>
      <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center", gap: 1, overflowX: "auto", p: 1 }}>
        {photos.map((item, i) => (
          <Button
            key={item.id}
            aria-label={`Ver a foto ${i + 1}`}
            aria-pressed={i === index}
            onClick={() => navigate(i)}
            sx={{
              ...control,
              p: 0.5,
              bgcolor: i === index ? "quintal.gema" : "quintal.papel",
              outline: i === index ? `3px solid ${quintalColors.papel}` : undefined,
            }}
          >
            <Box
              component="img"
              src={item.url}
              alt=""
              sx={{
                width: 64,
                height: 48,
                objectFit: "cover",
                border: i === index ? `2px solid ${quintalColors.tinta}` : "2px solid transparent",
              }}
            />
          </Button>
        ))}
      </Box>
    </Dialog>
  );
}
