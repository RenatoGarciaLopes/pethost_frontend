"use client";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { Daisy } from "../Daisy";
import { TurmaWalker } from "../TurmaWalker";

export interface SniffLoaderProps {
  /** Texto anunciado e visível. Padrão "Farejando". Os pontinhos piscando são só visuais. */
  label?: string;
  /** Escala da cena (padrão 1.3, como no board `Loading-Caes`). */
  scale?: number;
}

const empurraozinho = keyframes`
  0%, 70%, 100% { transform: scaleX(1); }
  80% { transform: scaleX(.84); }
  90% { transform: scaleX(1.03); }
`;

const pisca = keyframes`
  0%, 100% { opacity: .15; }
  50% { opacity: 1; }
`;

/**
 * Loading da marca (vault `design/14-loading.md`): a turma entrando na porta, dois cachorros por vez,
 * e a folha dando um empurrãozinho a cada entrada. `role="status"`: leitor de tela ouve o texto uma vez.
 * Com movimento reduzido, tudo parado.
 *
 * @example <SniffLoader label="Procurando cantinhos" />
 */
export function SniffLoader({ label = "Farejando", scale = 1.3 }: SniffLoaderProps) {
  const width = 230 * scale;
  return (
    <Box role="status" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "relative",
          width,
          height: 96 * scale,
          display: "flex",
          alignItems: "flex-end",
          "--loader-ink": theme.palette.quintal.tinta,
          "--loader-leaf": theme.palette.quintal.coral,
          "--loader-light": theme.palette.scene.doorLight,
        })}
      >
        {/* pista: termina no batente, o cachorro some atrás da folha */}
        <Box
          sx={{
            flex: 1,
            maskImage: "linear-gradient(90deg, transparent 0, black 22%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, black 22%)",
          }}
        >
          <TurmaWalker dogHeight={44 * scale} crossingMs={2000} intervalMs={667} />
        </Box>
        <svg viewBox="0 0 100 110" width={60 * scale} height={66 * scale} style={{ flexShrink: 0 }} focusable="false">
          <path
            d="M10 104V46A40 40 0 0 1 90 46V104Z"
            fill="var(--loader-light)"
            stroke="var(--loader-ink)"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <Box
            component="g"
            sx={{
              transformBox: "view-box",
              transformOrigin: "90px 75px",
              animation: `${empurraozinho} 667ms ease-out infinite`,
            }}
          >
            <path
              d="M50 104V46A20 40 0 0 1 90 46V104Z"
              fill="var(--loader-leaf)"
              stroke="var(--loader-ink)"
              strokeWidth="8"
              strokeLinejoin="round"
            />
          </Box>
        </svg>
        <Box sx={{ position: "absolute", left: "8%", bottom: 0 }}>
          <Daisy size={26 * scale} petal="branco" />
        </Box>
        <Box sx={{ position: "absolute", left: "38%", bottom: 0 }}>
          <Daisy size={20 * scale} petal="ceu" delayMs={700} />
        </Box>
      </Box>
      <Typography
        component="p"
        sx={(theme) => ({ fontFamily: theme.typography.h1.fontFamily, fontSize: "1.15rem", m: 0 })}
      >
        {label}
        <Box component="span" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <Box key={dot} component="span" sx={{ animation: `${pisca} 1.2s ease-in-out ${dot * 0.2}s infinite` }}>
              .
            </Box>
          ))}
        </Box>
      </Typography>
    </Box>
  );
}
