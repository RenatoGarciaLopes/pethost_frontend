import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";

/** Cores da marca que o estilo usa (vêm de `theme.palette.quintal`, nunca hex solto aqui). */
export interface MapStylePalette {
  tinta: string;
  texto2: string;
  gema: string;
  grama: string;
  ceu: string;
  cartao: string;
}

/** Tiles vetoriais do OpenFreeMap (sem chave); o provedor só recebe quais ladrilhos o recorte pede. */
export const MAP_TILES_URL = "https://tiles.openfreemap.org/planet";
const GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const LABEL_FONT = ["Noto Sans Bold"];

const zoomWidth = (low: number, high: number): ExpressionSpecification => [
  "interpolate",
  ["exponential", 1.5],
  ["zoom"],
  10,
  low,
  18,
  high,
];
const roadClass = (classes: string[]): ExpressionSpecification => ["in", ["get", "class"], ["literal", classes]];
const notTunnel: ExpressionSpecification = ["!=", ["get", "brunnel"], "tunnel"];

/**
 * Estilo próprio do mapa da busca, na estética Quintal (vault `marca/10-ilustracao-e-textura.md`): sem fundo
 * (o quadriculado de papel vem do contêiner), ruas com contorno de tinta, avenidas em gema, parques em verde-lima
 * com contorno, água em céu, só nomes de bairro em versalete espaçado, sem POIs nem ruído.
 * Esquema de camadas: OpenMapTiles (OpenFreeMap).
 *
 * @example new Map({ container, style: buildMapStyle(theme.palette.quintal) })
 */
export function buildMapStyle(palette: MapStylePalette): StyleSpecification {
  const source = "openmaptiles";
  const roads = (id: string, classes: string[], fill: string, low: number, high: number): LayerSpecification[] => [
    {
      id: `${id}-casing`,
      type: "line",
      source,
      "source-layer": "transportation",
      filter: ["all", roadClass(classes), notTunnel],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": palette.tinta, "line-width": zoomWidth(low + 2, high + 4) },
    },
    {
      id: `${id}-fill`,
      type: "line",
      source,
      "source-layer": "transportation",
      filter: ["all", roadClass(classes), notTunnel],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": fill, "line-width": zoomWidth(low, high) },
    },
  ];
  return {
    version: 8,
    name: "Quintal",
    glyphs: GLYPHS_URL,
    sources: {
      [source]: {
        type: "vector",
        url: MAP_TILES_URL,
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "verde-suave",
        type: "fill",
        source,
        "source-layer": "landcover",
        filter: roadClass(["grass", "wood"]),
        paint: { "fill-color": palette.grama, "fill-opacity": 0.25 },
      },
      {
        id: "parques",
        type: "fill",
        source,
        "source-layer": "park",
        paint: { "fill-color": palette.grama, "fill-outline-color": palette.tinta },
      },
      {
        id: "parques-contorno",
        type: "line",
        source,
        "source-layer": "park",
        paint: { "line-color": palette.tinta, "line-width": 1.5 },
      },
      { id: "agua", type: "fill", source, "source-layer": "water", paint: { "fill-color": palette.ceu } },
      {
        id: "agua-contorno",
        type: "line",
        source,
        "source-layer": "water",
        paint: { "line-color": palette.tinta, "line-width": 1.5 },
      },
      {
        id: "ruas",
        type: "line",
        source,
        "source-layer": "transportation",
        minzoom: 13.5,
        filter: ["all", roadClass(["minor", "service"]), notTunnel],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.tinta, "line-opacity": 0.4, "line-width": zoomWidth(0.6, 2.5) },
      },
      ...roads("secundarias", ["tertiary"], palette.cartao, 1.2, 8),
      ...roads("avenidas", ["secondary", "primary", "trunk", "motorway"], palette.gema, 2.5, 14),
      {
        id: "bairros",
        type: "symbol",
        source,
        "source-layer": "place",
        filter: roadClass(["suburb", "neighbourhood", "quarter"]),
        layout: {
          "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
          "text-font": LABEL_FONT,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.18,
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9, 16, 13],
          "text-max-width": 7,
        },
        paint: { "text-color": palette.texto2, "text-halo-color": palette.cartao, "text-halo-width": 1.5 },
      },
    ],
  };
}
