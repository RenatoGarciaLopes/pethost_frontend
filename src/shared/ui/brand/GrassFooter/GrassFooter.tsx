"use client";
import { Box, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useRef } from "react";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { CONTACT_CHANNELS } from "@/shared/config/contact";
import { NAV_ITEMS } from "@/shared/config/navigation";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { keyboardFocus } from "@/shared/theme/focus";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { GroundLine } from "../GroundLine";
import { DoorMark } from "../DoorMark";
import { grassFooterCopy as copy } from "./grassFooterCopy";

const footerLink = {
  color: "inherit",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  overflowWrap: "anywhere",
  [keyboardFocus()]: { outlineColor: "quintal.papel" },
} as const;

/** Mistura máxima de tinta nas cores da terra quando o rodapé aparece inteiro. */
const MAX_DARKEN = 0.3;

/** Geometria da terra; cores dinâmicas compartilhadas pela ilustração e pelo conteúdo. */
const soilLayer = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
} as const;

/** Quanto do rodapé já subiu na tela: 0 antes de aparecer, 1 com ele inteiro à vista. */
function descentProgress(rect: DOMRect, viewportHeight: number) {
  return Math.min(1, Math.max(0, (viewportHeight - rect.top) / rect.height));
}

/**
 * Rodapé público da casca: o gramado do hero (`GroundLine`) em cima e, descendo, terra clara, terra média
 * e terra funda, com pedrinhas e raízes no traço de tinta. Quem rola até o fim "entra debaixo da terra": a terra
 * escurece conforme o rodapé sobe na tela. Com `prefers-reduced-motion`, fica só o degradê estático.
 * Landmark `contentinfo` com navegação e contatos aprovados de `shared/config/contact`.
 * Texto em papel dentro da última camada; o mesmo tom acompanha a onda e o conteúdo, sem emenda.
 * Sem canais aprovados, a coluna de contato fica oculta e a navegação se distribui em duas colunas.
 *
 * @param mobileBottomSpace Reserva em unidades de espaçamento do tema para uma barra fixa no celular.
 * @param accountRole Papel confirmado pela sessão; ausente indica visitante. Somente visitante vê entrar/cadastro.
 * @example <GrassFooter mobileBottomSpace={12} />
 */
export function GrassFooter({
  mobileBottomSpace = 0,
  accountRole,
}: {
  mobileBottomSpace?: number;
  accountRole?: AccountRole;
}) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const links = [
    ...copy.links,
    ...(accountRole
      ? NAV_ITEMS.filter(
          (item) => item.roles.includes(accountRole) && (item.id === "owner-stays" || item.id === "host-home"),
        )
      : copy.visitorLinks),
  ];

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
      component="footer"
      data-testid="grass-footer"
      sx={(theme) => ({
        position: "relative",
        mt: { xs: 6, md: 8 },
        "--descida": 0,
        "--ink": theme.palette.quintal.tinta,
        "--soil-light": `color-mix(in srgb, ${theme.palette.scene.soilLight}, ${theme.palette.quintal.tinta} calc(var(--descida) * ${MAX_DARKEN * 100}%))`,
        "--soil-mid": `color-mix(in srgb, ${theme.palette.scene.soilMid}, ${theme.palette.quintal.tinta} calc(var(--descida) * ${MAX_DARKEN * 100}%))`,
        "--soil-deep": `color-mix(in srgb, ${theme.palette.scene.soilDeep}, ${theme.palette.quintal.tinta} calc(var(--descida) * ${MAX_DARKEN * 100}%))`,
        "--stone": `color-mix(in srgb, ${theme.palette.scene.stone}, ${theme.palette.quintal.tinta} calc(var(--descida) * ${MAX_DARKEN * 100}%))`,
      })}
    >
      <GroundLine variant="wave" height={44} />
      <Box
        data-testid="grass-footer-layers"
        aria-hidden="true"
        sx={{
          position: "relative",
          height: { xs: 220, md: 300 },
          overflow: "hidden",
          bgcolor: "scene.ground",
        }}
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
          <path d="M0 242C240 226 420 256 680 240S1020 224 1240 246 1390 238 1440 242V300H0Z" fill="var(--soil-deep)" />
          <path
            d="M0 242C240 226 420 256 680 240S1020 224 1240 246 1390 238 1440 242"
            fill="none"
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
      <Box data-testid="grass-footer-earth" sx={{ bgcolor: "var(--soil-deep)", color: "quintal.papel" }}>
        <PageContainer sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 3 + mobileBottomSpace, md: 3 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: CONTACT_CHANNELS.length ? "1fr 1fr 1fr" : "minmax(0, 1fr) minmax(0, 2fr)",
              },
              gap: { xs: 4, md: 8 },
            }}
          >
            <Box>
              <DoorMark withWordmark wordmarkColor="quintal.papel" interactive={false} />
              <Typography sx={{ mt: 2, maxWidth: 300 }}>{copy.tagline}</Typography>
            </Box>
            <Box component="nav" aria-label={copy.navigation}>
              <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
                {copy.navigation}
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  p: 0,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: CONTACT_CHANNELS.length ? "1fr" : "repeat(2, minmax(0, 1fr))" },
                  columnGap: 3,
                }}
              >
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link component={NextLink} href={href} sx={footerLink}>
                      {label}
                    </Link>
                  </li>
                ))}
              </Box>
            </Box>
            {CONTACT_CHANNELS.length > 0 && (
              <Box>
                <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
                  {copy.contact}
                </Typography>
                <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                  {CONTACT_CHANNELS.map(({ label, href }) => (
                    <li key={href}>
                      <Link href={href} sx={footerLink}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "quintal.papel" }}>
            © {new Date().getFullYear()} {copy.rights}
          </Typography>
        </PageContainer>
      </Box>
    </Box>
  );
}
