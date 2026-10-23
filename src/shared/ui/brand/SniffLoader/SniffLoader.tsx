"use client";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { Daisy } from "../Daisy";
import { TurmaWalker } from "../TurmaWalker";

export interface SniffLoaderProps {
  /** Texto anunciado e visível. Padrão "Farejando". Os pontinhos piscando são só visuais. */
  label?: string;
  /** Escala da cena (padrão 1.5: porta um pouco maior que o cachorro, como no board `Loading-Caes`). */
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
 * e a folha dando um empurrãozinho a cada entrada. Em camadas: batente e luz atrás, cachorro no meio (passa na frente
 * da luz) e folha coral na frente, onde ele some. Centraliza no espaço do contêiner (na vertical, quando ele tem altura).
 * `role="status"`: leitor de tela ouve o texto uma vez.
 * Com movimento reduzido, tudo parado.
 *
 * @example <SniffLoader label="Procurando cantinhos" />
 */
export function SniffLoader({ label = "Farejando", scale = 1.5 }: SniffLoaderProps) {
  const width = 230 * scale;
  const doorWidth = 60 * scale;
  const doorHeight = 66 * scale;
  // O chão da porta fica em y=104 de 110 no viewBox: o cachorro pisa na mesma linha.
  const groundOffset = (6 / 110) * doorHeight;
  const doorSvg = { position: "absolute", right: 0, bottom: 0, display: "block" } as const;
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "relative",
          width,
          maxWidth: "100%",
          height: 96 * scale,
          "--loader-ink": theme.palette.quintal.tinta,
          "--loader-leaf": theme.palette.quintal.coral,
          "--loader-light": theme.palette.scene.doorLight,
        })}
      >
        {/* fundo: batente e luz da porta */}
        <svg viewBox="0 0 100 110" width={doorWidth} height={doorHeight} style={doorSvg} focusable="false">
          <path
            d="M10 104V46A40 40 0 0 1 90 46V104Z"
            fill="var(--loader-light)"
            stroke="var(--loader-ink)"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </svg>
        {/* pista: vai até a borda da folha e corta ali, o cachorro some atrás dela */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            bottom: groundOffset,
            right: doorWidth * 0.1,
            maskImage: "linear-gradient(90deg, transparent 0, black 12%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, black 12%)",
          }}
        >
          <TurmaWalker dogHeight={44 * scale} crossingMs={2000} intervalMs={667} />
        </Box>
        {/* frente: folha coral com o empurrãozinho */}
        <svg viewBox="0 0 100 110" width={doorWidth} height={doorHeight} style={doorSvg} focusable="false">
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
