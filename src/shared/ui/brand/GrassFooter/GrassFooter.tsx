"use client";
import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { GroundLine } from "../GroundLine";

/** Quanto a terra escurece (brilho), no máximo, quando o rodapé aparece inteiro (fim da rolagem). */
const MAX_DARKEN = 0.3;

/** Só a terra escurece (a grama não): o filtro vai nos dois svgs de terra, lido de `--descida`. */
const soilLayer = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  filter: `brightness(calc(1 - var(--descida) * ${MAX_DARKEN}))`,
} as const;

/** Quanto do rodapé já subiu na tela: 0 antes de aparecer, 1 com ele inteiro à vista. */
function descentProgress(rect: DOMRect, viewportHeight: number) {
  return Math.min(1, Math.max(0, (viewportHeight - rect.top) / rect.height));
}

/**
 * Rodapé decorativo da casca: o gramado do hero (`GroundLine`) em cima e, descendo, terra clara, terra média
 * e terra funda, com pedrinhas e raízes no traço de tinta. Quem rola até o fim "entra debaixo da terra": a terra
 * escurece conforme o rodapé sobe na tela. Com `prefers-reduced-motion`, fica só o degradê estático.
 * Sem conteúdo e sem landmark (`aria-hidden`); só desenho.
 *
 * @example <GrassFooter />
 */
export function GrassFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const footer = ref.current;
    if (!footer || reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = descentProgress(footer.getBoundingClientRect(), window.innerHeight);
      footer.style.setProperty("--descida", progress.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  return (
    <Box
      ref={ref}
      aria-hidden="true"
      data-testid="grass-footer"
      sx={(theme) => ({
        position: "relative",
        mt: { xs: 6, md: 8 },
        "--descida": 0,
        "--ink": theme.palette.quintal.tinta,
      })}
    >
      <GroundLine variant="wave" height={44} />
      <Box
        sx={(theme) => ({
          position: "relative",
          height: { xs: 220, md: 300 },
          overflow: "hidden",
          bgcolor: "scene.ground",
          borderBottom: "2px solid var(--ink)",
          "--soil-light": theme.palette.scene.soilLight,
          "--soil-mid": theme.palette.scene.soilMid,
          "--soil-deep": theme.palette.scene.soilDeep,
          "--stone": theme.palette.scene.stone,
        })}
      >
        <Box component="svg" viewBox="0 0 1440 300" preserveAspectRatio="none" focusable="false" sx={soilLayer}>
          <path
            d="M0 70C180 52 330 92 520 72S860 48 1040 76 1320 66 1440 74V300H0Z"
            fill="var(--soil-light)"
            stroke="var(--ink)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 164C200 148 380 184 600 164S940 146 1160 170 1360 160 1440 166V300H0Z"
            fill="var(--soil-mid)"
            stroke="var(--ink)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 242C240 226 420 256 680 240S1020 224 1240 246 1390 238 1440 242V300H0Z"
            fill="var(--soil-deep)"
            stroke="var(--ink)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </Box>
        <Box
          component="svg"
          viewBox="0 0 1440 300"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          sx={soilLayer}
        >
          <g fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
            <path d="M210 70C206 96 224 110 216 138S196 168 204 196" />
            <path d="M216 138C238 142 252 152 262 170" />
            <path d="M1080 76C1088 100 1068 120 1078 148S1100 178 1090 214" />
            <path d="M1078 148C1054 152 1040 164 1030 182" />
          </g>
          <g fill="var(--stone)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
            <ellipse cx="420" cy="128" rx="22" ry="14" />
            <ellipse cx="452" cy="136" rx="12" ry="8" />
            <ellipse cx="760" cy="206" rx="26" ry="15" />
            <ellipse cx="1260" cy="130" rx="18" ry="12" />
            <ellipse cx="1296" cy="138" rx="9" ry="6" />
            <ellipse cx="96" cy="214" rx="20" ry="12" />
          </g>
        </Box>
      </Box>
    </Box>
  );
}
