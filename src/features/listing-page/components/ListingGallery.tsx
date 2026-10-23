import { Box, Typography } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { Sticker } from "@/shared/ui/feedback/Sticker";
import type { ListingDetail } from "../api/contracts";
import { listingPageCopy as copy } from "../lib/listingPageCopy";

export interface ListingGalleryProps {
  title: string;
  /** Até 5, já na ordem da API (a 1 é a capa). */
  photos: ListingDetail["photos"];
  /** Selo "Vizinho" sobre a capa. */
  neighbor: boolean;
}

/** Moldura das fotos: contorno de tinta, raio e sombra dura, como nos cards da busca. */
const frame = {
  border: "2px solid",
  borderColor: "text.primary",
  borderRadius: `${quintalRadii.media}px`,
  boxShadow: hardShadow(5),
  overflow: "hidden",
} as const;

/**
 * Galeria do cantinho como na prancha: no computador, a capa grande à esquerda e duas fotos empilhadas à direita;
 * no celular, carrossel com rolagem lateral (todas as fotos). Sem foto, estado vazio com a porta da marca, nunca
 * um bloco cinza.
 * @example <ListingGallery title={listing.title} photos={photos} neighbor={listing.badges?.includes("neighbor")} />
 */
export function ListingGallery({ title, photos, neighbor }: ListingGalleryProps) {
  const sticker = neighbor && (
    <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
      <Sticker label={copy.neighbor} color="grama" tilt={4} />
    </Box>
  );
  if (photos.length === 0)
    return (
      <Box
        sx={{
          ...frame,
          position: "relative",
          minHeight: { xs: 220, md: 320 },
          bgcolor: "quintal.cartao",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          p: 3,
        }}
      >
        {sticker}
        <Box sx={{ display: "grid", justifyItems: "center", gap: 1.5 }}>
          <DoorMark size="large" width={88} interactive={false} />
          <Typography sx={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>{copy.noPhoto}</Typography>
          <Typography variant="body2" color="text.secondary">
            {copy.noPhotoHint}
          </Typography>
        </Box>
      </Box>
    );
  const shownOnDesktop = Math.min(photos.length, 3);
  return (
    <Box
      component="ul"
      aria-label={copy.gallery(title)}
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        pb: { xs: 1, md: 0 },
        display: { xs: "flex", md: "grid" },
        gap: 2,
        overflowX: { xs: "auto", md: "visible" },
        scrollSnapType: { xs: "x mandatory", md: "none" },
        gridTemplateColumns: { md: shownOnDesktop > 1 ? "2fr 1fr" : "1fr" },
        gridTemplateRows: { md: "repeat(2, 220px)" },
      }}
    >
      {photos.map((photo, index) => (
        <Box
          component="li"
          key={photo.id}
          sx={{
            ...frame,
            position: "relative",
            flex: { xs: `0 0 ${photos.length > 1 ? "86%" : "100%"}` },
            aspectRatio: { xs: "4 / 3", md: "auto" },
            scrollSnapAlign: "start",
            display: { md: index < 3 ? "block" : "none" },
            gridRow: { md: index === 0 || (index === 1 && shownOnDesktop === 2) ? "span 2" : undefined },
          }}
        >
          {index === 0 && sticker}
          <Box
            component="img"
            src={photo.url}
            alt={copy.photoAlt(index + 1, title)}
            sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ))}
    </Box>
  );
}
