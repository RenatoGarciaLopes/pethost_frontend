"use client";
import { Box, ButtonBase, Checkbox, Chip, FormControlLabel, Typography, useTheme } from "@mui/material";
import { Map as MapLibreMap, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { mapCopy } from "../../../lib/mapCopy";
import { boundsOf, circleRing, pointAt, radiusKmFromBounds, type GeoPoint } from "../../../lib/mapGeometry";
import { buildMapStyle } from "../../../lib/mapStyle";
import { mapPrice } from "../../../lib/mapPrice";
import { searchCopy } from "../../../lib/searchCopy";
import type { SearchMapProps } from "./SearchMap";
import type { ListingSummary } from "../../../api/contracts";

/** Centro de Maringá (piloto), usado só quando não há nenhum ponto para enquadrar. */
const FALLBACK_CENTER: [number, number] = [-51.9386, -23.4205];
const RING_KM = [1, 2, 4];
const GRID_PX = 32;
const FIT_PADDING = { top: 72, left: 80, right: 80, bottom: 120 };

interface Pixel {
  x: number;
  y: number;
}

/** Mapa MapLibre com os pinos, círculos e cartão em React por cima. Carregado sob demanda por `SearchMap`. */
export function SearchMapView({
  listings,
  origin,
  selectedId = null,
  onSelect,
  searchOnMove,
  onSearchOnMoveChange,
  onMoveEnd,
  stay,
  compatibleIds,
  compatibleLabel,
  hrefFor = (id) => `/listings/${id}`,
}: SearchMapProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, setFrame] = useState(0);
  const latest = useRef({ searchOnMove, onMoveEnd, reducedMotion });
  useEffect(() => {
    latest.current = { searchOnMove, onMoveEnd, reducedMotion };
  });

  const points = useMemo<GeoPoint[]>(
    () => [...listings.map((listing) => listing.approximateLocation), ...(origin ? [origin] : [])],
    [listings, origin],
  );
  const idsKey = listings.map((listing) => listing.id).join("|");
  const selected = listings.find((listing) => listing.id === selectedId);

  const approxData = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: listings.map((listing) => ({
        type: "Feature" as const,
        properties: { id: listing.id },
        geometry: {
          type: "Polygon" as const,
          coordinates: [circleRing(listing.approximateLocation, listing.approximateLocation.radiusMeters)],
        },
      })),
    }),
    [listings],
  );
  const ringsData = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: origin
        ? RING_KM.map((km) => ({
            type: "Feature" as const,
            properties: { km },
            geometry: { type: "LineString" as const, coordinates: circleRing(origin, km * 1000) },
          }))
        : [],
    }),
    [origin],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { quintal } = theme.palette;
    const bounds = boundsOf(points);
    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container,
        style: buildMapStyle(quintal),
        ...(bounds
          ? {
              bounds: [
                [bounds.west, bounds.south],
                [bounds.east, bounds.north],
              ] as [[number, number], [number, number]],
              fitBoundsOptions: { padding: FIT_PADDING, maxZoom: 15 },
            }
          : { center: FALLBACK_CENTER, zoom: 12 }),
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      });
    } catch {
      // Sem WebGL o construtor lança; o aviso entra fora do corpo síncrono do efeito.
      queueMicrotask(() => setFailed(true));
      return;
    }
    instance.touchZoomRotate.disableRotation();
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setFrame((value) => value + 1);
      });
    };
    instance.on("move", schedule);
    instance.on("resize", schedule);
    instance.on("moveend", (event) => {
      schedule();
      const fromPerson =
        Boolean(event.originalEvent) || Boolean((event as unknown as { userAction?: boolean }).userAction);
      if (!fromPerson || !latest.current.searchOnMove) return;
      const center = instance.getCenter();
      const view = instance.getBounds();
      latest.current.onMoveEnd?.(
        { latitude: center.lat, longitude: center.lng },
        radiusKmFromBounds({
          west: view.getWest(),
          south: view.getSouth(),
          east: view.getEast(),
          north: view.getNorth(),
        }),
      );
    });
    instance.on("load", () => {
      instance.addSource("aproximado", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      instance.addSource("aneis", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      instance.addLayer({
        id: "aproximado-area",
        type: "fill",
        source: "aproximado",
        paint: { "fill-color": quintal.grama, "fill-opacity": 0.08 },
      });
      instance.addLayer({
        id: "aproximado-borda",
        type: "line",
        source: "aproximado",
        paint: { "line-color": quintal.tinta, "line-width": 1.5, "line-dasharray": [2, 2] },
      });
      instance.addLayer({
        id: "aneis-linha",
        type: "line",
        source: "aneis",
        paint: { "line-color": quintal.texto2, "line-width": 1.5, "line-dasharray": [3, 3] },
      });
      setStyleReady(true);
    });
    setMap(instance);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      instance.remove();
      setMap(null);
      setStyleReady(false);
    };
    // O mapa nasce uma vez; pontos e dados seguem nos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map || !styleReady) return;
    (map.getSource("aproximado") as GeoJSONSource).setData(approxData);
    (map.getSource("aneis") as GeoJSONSource).setData(ringsData);
  }, [map, styleReady, approxData, ringsData]);

  const firstFit = useRef(true);
  useEffect(() => {
    if (firstFit.current) {
      firstFit.current = false;
      return;
    }
    const bounds = boundsOf(points);
    // Com "buscar ao mexer", o mapa é quem manda: reenquadrar desfaria o gesto da pessoa.
    if (!map || !bounds || latest.current.searchOnMove) return;
    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: FIT_PADDING, maxZoom: 15, duration: latest.current.reducedMotion ? 0 : 500 },
    );
    // Só quando muda o conjunto de cantinhos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    if (!map || !selected) return;
    map.easeTo({
      center: [selected.approximateLocation.longitude, selected.approximateLocation.latitude],
      padding: { bottom: 200, top: 0, left: 0, right: 0 },
      duration: latest.current.reducedMotion ? 0 : 400,
    });
    // Seguir só a seleção, não cada recarga da lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selected?.id]);

  const project = (point: GeoPoint): Pixel | null => {
    if (!map) return null;
    const { x, y } = map.project([point.longitude, point.latitude]);
    return { x, y };
  };
  const anchor = map?.project([0, 0]);
  const gridOffset = anchor
    ? { x: ((anchor.x % GRID_PX) + GRID_PX) % GRID_PX, y: ((anchor.y % GRID_PX) + GRID_PX) % GRID_PX }
    : { x: 0, y: 0 };
  const zoom = (direction: "zoomIn" | "zoomOut") =>
    map?.[direction]({ duration: reducedMotion ? 0 : 300 }, { userAction: true });
  const pins = listings
    .map((listing) => ({ listing, at: project(listing.approximateLocation) }))
    .filter((pin): pin is { listing: ListingSummary; at: Pixel } => pin.at !== null)
    .sort((a, b) => a.at.y - b.at.y);
  const originAt = origin ? project(origin) : null;
  const ink = theme.palette.quintal.tinta;
  const hasTotal = Boolean(stay && stay.nights > 0 && stay.petCount > 0);

  return (
    <Box
      onKeyDown={(event) => {
        if (event.key === "Escape" && selectedId) onSelect(null);
      }}
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: "quintal.cartao",
        backgroundImage: `linear-gradient(to right, ${theme.palette.quintal.linha} 1px, transparent 1px), linear-gradient(to bottom, ${theme.palette.quintal.linha} 1px, transparent 1px)`,
        backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
        backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
      }}
    >
      <Box sx={{ position: "absolute", inset: 0 }}>
        {/* O MapLibre troca a posição do contêiner para relative: ele precisa de tamanho próprio, não de inset. */}
        <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
      </Box>
      {failed && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", p: 3, textAlign: "center" }}>
          <Typography role="status">{mapCopy.unavailable}</Typography>
        </Box>
      )}

      <Box aria-hidden="true" sx={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {origin &&
          originAt &&
          RING_KM.map((km) => {
            const label = project(pointAt(origin, 40, km));
            return label ? (
              <Typography
                key={km}
                component="span"
                sx={{
                  position: "absolute",
                  left: label.x,
                  top: label.y,
                  transform: "translate(-50%, -50%)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "quintal.texto2",
                  bgcolor: "quintal.cartao",
                  px: 0.5,
                  borderRadius: `${quintalRadii.control}px`,
                }}
              >
                {mapCopy.ringLabel(km)}
              </Typography>
            ) : null;
          })}
        {originAt && (
          <Box
            sx={{
              position: "absolute",
              left: originAt.x,
              top: originAt.y,
              transform: "translate(-50%, -100%)",
              display: "grid",
              justifyItems: "center",
              gap: 0.25,
            }}
          >
            <DoorMark width={24} interactive={false} />
            <Typography
              component="span"
              sx={{
                fontSize: 11,
                fontWeight: 800,
                whiteSpace: "nowrap",
                bgcolor: "background.default",
                border: "1.5px solid",
                borderColor: "text.primary",
                borderRadius: `${quintalRadii.pill}px`,
                px: 0.75,
              }}
            >
              {origin?.label ? mapCopy.origin(origin.label) : mapCopy.originFallback}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {pins.map(({ listing, at }) => {
          const isSelected = listing.id === selectedId;
          const compatible = compatibleIds?.has(listing.id) ?? false;
          const price = mapPrice(listing.nightlyRate, stay);
          return (
            <ButtonBase
              key={listing.id}
              aria-label={mapCopy.pinLabel(listing.title, price)}
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : listing.id)}
              sx={{
                position: "absolute",
                left: at.x,
                top: at.y,
                transform: "translate(-50%, calc(-100% - 7px))",
                pointerEvents: "auto",
                zIndex: isSelected ? 3 : compatible ? 2 : 1,
                px: 1.25,
                py: 0.25,
                minHeight: 28,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: "nowrap",
                border: "2px solid",
                borderColor: "text.primary",
                borderRadius: `${quintalRadii.pill}px`,
                boxShadow: hardShadow(3),
                color: isSelected ? "background.default" : "text.primary",
                bgcolor: isSelected ? "text.primary" : compatible ? "quintal.grama" : "background.default",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: "50%",
                  bottom: -7,
                  width: 9,
                  height: 9,
                  transform: "translateX(-50%) rotate(45deg)",
                  bgcolor: "inherit",
                  borderRight: "2px solid",
                  borderBottom: "2px solid",
                  borderColor: "text.primary",
                },
              }}
            >
              {price}
            </ButtonBase>
          );
        })}
      </Box>

      <FormControlLabel
        label={mapCopy.searchOnMove}
        control={
          <Checkbox
            size="small"
            checked={searchOnMove}
            onChange={(event) => onSearchOnMoveChange(event.target.checked)}
          />
        }
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          m: 0,
          pr: 1.5,
          bgcolor: "background.default",
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.pill}px`,
          boxShadow: hardShadow(3),
          "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 700 },
        }}
      />

      <Box sx={{ position: "absolute", top: 12, right: 12, display: "grid", gap: 0.75 }}>
        {(
          [
            ["zoomIn", mapCopy.zoomIn, "+"],
            ["zoomOut", mapCopy.zoomOut, "−"],
          ] as const
        ).map(([direction, label, glyph]) => (
          <ButtonBase
            key={direction}
            aria-label={label}
            onClick={() => zoom(direction)}
            sx={{
              width: 40,
              height: 40,
              fontSize: 22,
              fontWeight: 800,
              bgcolor: "background.default",
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: `${quintalRadii.control}px`,
              boxShadow: hardShadow(3),
            }}
          >
            <span aria-hidden="true">{glyph}</span>
          </ButtonBase>
        ))}
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 4,
          display: "grid",
          gap: 1,
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        {selected && (
          <Box
            sx={{
              minWidth: 0,
              width: "100%",
              maxWidth: 460,
              display: "flex",
              gap: 1.5,
              p: 1,
              bgcolor: "background.default",
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: `${quintalRadii.field}px`,
              boxShadow: hardShadow(5),
              position: "relative",
            }}
          >
            {selected.coverPhotoUrl ? (
              <Box
                component="img"
                src={selected.coverPhotoUrl}
                alt={searchCopy.photoAlt(selected.title)}
                sx={{
                  width: 112,
                  height: 84,
                  objectFit: "cover",
                  borderRadius: `${quintalRadii.media}px`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 112,
                  height: 84,
                  flexShrink: 0,
                  borderRadius: `${quintalRadii.media}px`,
                  bgcolor: "action.hover",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {searchCopy.noPhoto}
              </Box>
            )}
            <Box sx={{ minWidth: 0, display: "grid", alignContent: "center", gap: 0.5, pr: 4 }}>
              <Typography
                component={Link}
                href={hrefFor(selected.id)}
                sx={{ fontFamily: "var(--font-display)", fontSize: 17, color: "text.primary", textDecoration: "none" }}
              >
                {selected.title}
              </Typography>
              <Typography sx={{ fontSize: 12.5 }}>
                {[
                  selected.neighborhood,
                  selected.distanceKm != null
                    ? mapCopy.distance(selected.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 }))
                    : null,
                  selected.rating
                    ? mapCopy.rating(
                        selected.rating.average.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }),
                        selected.rating.count,
                      )
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
              {compatibleIds?.has(selected.id) && compatibleLabel && (
                <Chip
                  size="small"
                  variant="ok"
                  label={`✓ ${compatibleLabel}`}
                  sx={{ justifySelf: "start", maxWidth: "100%", height: 24, fontSize: 12.5 }}
                />
              )}
              <Typography sx={{ fontWeight: 800 }}>
                {mapPrice(selected.nightlyRate, stay)}{" "}
                <Box component="span" sx={{ fontWeight: 400, fontSize: 12.5 }}>
                  {hasTotal ? mapCopy.total : mapCopy.perNight}
                </Box>
              </Typography>
            </Box>
            <ButtonBase
              aria-label={mapCopy.closeCard}
              onClick={() => onSelect(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px solid",
                borderColor: "text.primary",
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              <span aria-hidden="true">×</span>
            </ButtonBase>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            bgcolor: "quintal.cartao",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: `${quintalRadii.pill}px`,
            fontSize: 12.5,
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
            sx={{ flexShrink: 0 }}
          >
            <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke={ink} strokeWidth="1.8" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke={ink} strokeWidth="1.8" />
          </Box>
          <span>{mapCopy.privacy}</span>
        </Box>
        <Typography
          component="a"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            justifySelf: "end",
            fontSize: 10,
            color: "quintal.texto2",
            lineHeight: 1.2,
            bgcolor: "quintal.cartao",
            borderRadius: `${quintalRadii.control}px`,
            px: 0.75,
          }}
        >
          {mapCopy.attribution}
        </Typography>
      </Box>
    </Box>
  );
}
