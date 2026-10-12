"use client";
import { Box, useTheme } from "@mui/material";
import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import { useId, useRef, useState, type MouseEvent } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { EASE_AMBIENTE, MOTION_ACOLHER, MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { DaisyGlyph, type DaisyPetal } from "../Daisy";
import { useDoorTarget } from "./useDoorTarget";
import { usePointerParallax } from "./usePointerParallax";

export type DoorSceneState = "auto" | "closed" | "open" | "wide";

export interface DoorSceneProps {
  /**
   * `auto` (padrão) reage ao formulário marcado com `DOOR_TARGET_ATTR` na mesma página.
   * Os outros fixam um estado (stories, telas estáticas).
   */
  state?: DoorSceneState;
}

/** Abertura da folha (`scaleX`, dobradiça à direita). `closed` é a pose do logo: meia porta com luz. */
const LEAF = { closed: 1, peek: 0.84, open: 0.55, wide: 0.32, swing: 0.24 } as const;
const BEAM = {
  closed: { scaleX: 1, opacity: 0.55 },
  open: { scaleX: 1.25, opacity: 0.75 },
  wide: { scaleX: 1.45, opacity: 0.95 },
} as const;

/** Linha do chão no `viewBox` (360 × 300). */
const GROUND_Y = 228;
/** Quantas flores plantadas ficam; a mais antiga murcha quando nasce outra. */
const MAX_PLANTED = 6;
const PLANT_PETALS: readonly DaisyPetal[] = ["coral", "branco", "ceu"];

/** Montagem da cena, em segundos desde que aparece. O ambiente começa quando a folha assenta. */
const BUILD = { ground: 0.1, door: 0.25, leaf: 0.5, mat: 0.6, daisies: 0.7 } as const;

/** Profundidade do parallax, em unidades do `viewBox` por metade da tela. Negativo vai ao contrário. */
const DEPTH = { sky: -5, flowers: 4, pollen: 9 } as const;

interface SceneFlower {
  id: number;
  x: number;
  y: number;
  height: number;
  petal: DaisyPetal;
}

/** Margaridas fixas, uma de cada lado da porta. */
const BORDER_FLOWERS: readonly SceneFlower[] = [
  { id: -1, x: 82, y: 231, height: 49, petal: "branco" },
  { id: -2, x: 293, y: 231, height: 43, petal: "ceu" },
];

const POLLEN = [
  { cx: 92, cy: 196, delay: 0 },
  { cx: 268, cy: 184, delay: 1.4 },
  { cx: 300, cy: 206, delay: 2.8 },
] as const;

/** Mais perto de quem olha (mais embaixo no gramado), maior. */
const flowerHeightAt = (y: number) => 30 + ((y - GROUND_Y) / (300 - GROUND_Y)) * 22;

/**
 * Cena da porta (REQ-DS-015): a porta do logo em tamanho grande num quintal com céu, nuvens,
 * gramado, capacho com patinha, margaridas e pólen. Ocupa a largura do contêiner (quem usa limita).
 *
 * - **Monta-se sozinha** ao aparecer: o chão é desenhado, a porta sobe, a folha balança até a pose do logo
 *   (mola "acolher"), o capacho assenta e as flores nascem; depois começa o ambiente (luz respirando,
 *   pólen, nuvens, flores balançando).
 * - **Reage ao formulário** marcado (`DOOR_TARGET_ATTR`/`DOOR_WARM_ATTR`): abre com mouse ou foco nele,
 *   abre mais e esquenta a luz no botão principal.
 * - **É de brincar:** passar o mouse na porta faz ela entreabrir; clicar na porta ou no capacho
 *   faz ela abrir e voltar; clicar no gramado planta uma margarida; flores balançam ao toque;
 *   com mouse, a cena acompanha o ponteiro em camadas (parallax).
 *
 * É ambiente, nunca informação: `aria-hidden`, sem foco de teclado, e clicar nela não tira o foco
 * do formulário. Com movimento reduzido, nada se mexe sozinho e as respostas ao clique viram corte seco.
 *
 * @example
 * <DoorScene />
 * <form {...{ [DOOR_TARGET_ATTR]: "" }}>…<Button {...{ [DOOR_WARM_ATTR]: "" }}>Entrar</Button></form>
 */
export function DoorScene({ state = "auto" }: DoorSceneProps) {
  const { palette } = useTheme();
  const ink = palette.quintal.tinta;
  const light = palette.scene.doorLight;
  const glow = palette.scene.doorGlow;
  const skyId = useId();

  const reducedMotion = usePrefersReducedMotion();
  const form = useDoorTarget(state === "auto");
  const pointer = usePointerParallax(!reducedMotion);
  const skyX = useDepth(pointer.x, DEPTH.sky);
  const flowersX = useDepth(pointer.x, DEPTH.flowers);
  const pollenX = useDepth(pointer.x, DEPTH.pollen);
  const pollenY = useDepth(pointer.y, DEPTH.pollen / 2);

  const svgRef = useRef<SVGSVGElement>(null);
  const nextFlowerId = useRef(0);
  const [built, setBuilt] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [swinging, setSwinging] = useState(false);
  const [planted, setPlanted] = useState<readonly SceneFlower[]>([]);

  const doorState = state !== "auto" ? state : form.warm ? "wide" : form.engaged ? "open" : "closed";
  const leafScale = swinging ? LEAF.swing : doorState === "closed" && peeking ? LEAF.peek : LEAF[doorState];
  const warmLight = swinging || doorState === "wide";
  const ambient = built && !reducedMotion;

  function swingDoor() {
    setSwinging(true);
  }

  function plantFlower(event: MouseEvent<SVGPathElement>) {
    const matrix = svgRef.current?.getScreenCTM()?.inverse();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    const y = Math.min(Math.max(point.y, GROUND_Y + 10), 292);
    const id = nextFlowerId.current++;
    const flower = { id, x: point.x, y, height: flowerHeightAt(y), petal: PLANT_PETALS[id % PLANT_PETALS.length] };
    setPlanted((current) => [...current, flower].slice(-MAX_PLANTED));
  }

  return (
    <Box aria-hidden="true" sx={{ width: "100%", userSelect: "none", WebkitTapHighlightColor: "transparent" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 360 300"
        width="100%"
        focusable="false"
        style={{ display: "block", overflow: "visible" }}
        // Brincar com a cena não tira o foco do campo em que a pessoa estava.
        onPointerDown={(event) => event.preventDefault()}
      >
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.scene.skyTop} />
            <stop offset=".6" stopColor={palette.scene.skyMiddle} />
            <stop offset="1" stopColor={palette.scene.skyBottom} />
          </linearGradient>
        </defs>

        {/* céu em arco atrás da porta, com duas nuvens à deriva */}
        <motion.g style={{ x: skyX }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <path d="M18 228V132C18 64 92 22 180 22s162 42 162 110V228Z" fill={`url(#${skyId})`} />
          <Cloud x={46} y={70} scale={0.9} ink={ink} fill={palette.background.paper} drift={ambient} delay={0} />
          <Cloud x={262} y={46} scale={0.7} ink={ink} fill={palette.background.paper} drift={ambient} delay={6} />
        </motion.g>

        {/* gramado; clicar nele planta uma margarida */}
        <motion.path
          d="M0 228C80 224 150 230 200 227s110-2 160 1V288a12 12 0 0 1-12 12H12A12 12 0 0 1 0 288Z"
          fill={palette.scene.ground}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: BUILD.ground + 0.3 }}
          onClick={plantFlower}
          style={{ cursor: "pointer" }}
        />

        {/* facho de luz saindo da porta */}
        <motion.path
          d="M132 228h96l52 72H80Z"
          fill={glow}
          pointerEvents="none"
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0 }}
          initial={{ scaleX: 0.4, opacity: 0 }}
          animate={BEAM[swinging ? "wide" : doorState]}
          transition={{ ...MOTION_ASSENTAR, delay: built ? 0 : BUILD.leaf }}
        />

        {/* linha do horizonte, desenhada da esquerda para a direita */}
        <motion.path
          d="M0 228C80 224 150 230 200 227s110-2 160 1"
          fill="none"
          stroke={ink}
          strokeWidth="3"
          strokeLinecap="round"
          pointerEvents="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: EASE_AMBIENTE, delay: BUILD.ground }}
        />

        {/* porta do logo: sobe do chão, depois a folha balança até a pose do logo */}
        <motion.g
          style={{ transformBox: "fill-box", originX: 0.5, originY: 1, cursor: "pointer" }}
          initial={{ opacity: 0, scaleY: 0.5 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ ...MOTION_ASSENTAR, delay: BUILD.door }}
          onHoverStart={() => setPeeking(true)}
          onHoverEnd={() => setPeeking(false)}
          onClick={swingDoor}
        >
          <g transform="translate(100 60) scale(1.6)">
            <motion.path
              d="M10 104V46A40 40 0 0 1 90 46V104Z"
              stroke={ink}
              strokeWidth="3.9"
              strokeLinejoin="round"
              initial={{ fill: light }}
              animate={warmLight || !ambient ? { fill: warmLight ? glow : light } : { fill: [light, glow, light] }}
              transition={
                warmLight || !ambient ? { duration: 0.4 } : { duration: 3.6, ease: "easeInOut", repeat: Infinity }
              }
            />
          </g>
          <motion.g
            style={{ transformBox: "fill-box", originX: 1, originY: 0.5 }}
            initial={{ scaleX: LEAF.wide }}
            animate={{ scaleX: leafScale }}
            transition={{ ...MOTION_ACOLHER, delay: built ? 0 : BUILD.leaf }}
            onAnimationComplete={() => {
              setBuilt(true);
              if (swinging) setSwinging(false);
            }}
          >
            <g transform="translate(100 60) scale(1.6)">
              <path
                d="M50 104V46A20 40 0 0 1 90 46V104Z"
                fill={palette.quintal.coral}
                stroke={ink}
                strokeWidth="3.9"
                strokeLinejoin="round"
              />
              <circle cx="57.5" cy="77" r="3.2" fill={ink} />
            </g>
          </motion.g>
        </motion.g>

        {/* capacho céu com patinha: bater nele também chama a porta */}
        <motion.g
          style={{ transformBox: "fill-box", originX: 0.5, originY: 1, cursor: "pointer" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scaleY: 0.8 }}
          transition={{ ...MOTION_ASSENTAR, delay: BUILD.mat }}
          onClick={swingDoor}
        >
          <rect x="138" y="230" width="84" height="16" rx="8" fill={palette.ceu.main} stroke={ink} strokeWidth="3" />
          <g fill={ink}>
            <ellipse cx="180" cy="239.5" rx="3.6" ry="2.8" />
            <circle cx="174.5" cy="235" r="1.5" />
            <circle cx="178.5" cy="233.6" r="1.5" />
            <circle cx="182.5" cy="233.6" r="1.5" />
            <circle cx="186.5" cy="235" r="1.5" />
          </g>
        </motion.g>

        {/* margaridas: duas fixas e as que a pessoa plantar */}
        <motion.g style={{ x: flowersX }}>
          {BORDER_FLOWERS.map((flower, index) => (
            <SceneDaisy
              key={flower.id}
              flower={flower}
              delay={BUILD.daisies + index * 0.12}
              sway={ambient}
              swayDelay={index * 0.9}
            />
          ))}
          <AnimatePresence>
            {planted.map((flower) => (
              <SceneDaisy key={flower.id} flower={flower} delay={0} sway={ambient} swayDelay={(flower.id % 3) * 0.7} />
            ))}
          </AnimatePresence>
        </motion.g>

        {/* três pontinhos de pólen subindo */}
        <motion.g style={{ x: pollenX, y: pollenY }} pointerEvents="none">
          {POLLEN.map((dot) => (
            <motion.circle
              key={dot.cx}
              cx={dot.cx}
              cy={dot.cy}
              r="3"
              fill={glow}
              stroke={ink}
              strokeWidth="1.5"
              initial={{ opacity: 0 }}
              animate={reducedMotion ? { opacity: 1 } : ambient ? { y: [0, -46], opacity: [0, 1, 0] } : { opacity: 0 }}
              transition={
                ambient
                  ? { duration: 4.2, ease: "easeOut", times: [0, 0.2, 1], repeat: Infinity, delay: dot.delay }
                  : { duration: 0.3 }
              }
            />
          ))}
        </motion.g>
      </svg>
    </Box>
  );
}

/** Camada do parallax: posição do ponteiro (-1 a 1) vezes a profundidade. */
function useDepth(value: MotionValue<number>, depth: number): MotionValue<number> {
  return useTransform(value, (v) => v * depth);
}

interface SceneDaisyProps {
  flower: SceneFlower;
  /** Atraso do nascimento, em segundos. */
  delay: number;
  /** Balança sozinha (ambiente ligado). */
  sway: boolean;
  swayDelay: number;
}

/** Margarida da cena: nasce com "acolher", balança e se sacode quando o mouse passa ou o dedo toca. */
function SceneDaisy({ flower, delay, sway, swayDelay }: SceneDaisyProps) {
  const scale = flower.height / 64;
  const shake = { rotate: [0, -14, 10, -5, 0], transition: { duration: 0.7 } };
  const stemBase = { transformBox: "fill-box", originX: 0.5, originY: 1 } as const;

  return (
    <g transform={`translate(${flower.x} ${flower.y})`}>
      <motion.g
        style={stemBase}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0, opacity: 0, transition: MOTION_ASSENTAR }}
        transition={{ ...MOTION_ACOLHER, delay }}
        whileHover={shake}
        whileTap={shake}
      >
        <motion.g
          style={stemBase}
          animate={sway ? { rotate: [-4, 5, -4] } : { rotate: 0 }}
          transition={
            sway ? { duration: 3.2, ease: "easeInOut", repeat: Infinity, delay: swayDelay } : { duration: 0.3 }
          }
        >
          <g transform={`scale(${scale}) translate(-20 -62)`}>
            <DaisyGlyph petal={flower.petal} />
          </g>
        </motion.g>
      </motion.g>
    </g>
  );
}

interface CloudProps {
  x: number;
  y: number;
  scale: number;
  ink: string;
  fill: string;
  /** Deriva devagar de um lado para o outro (38 s ida e volta). */
  drift: boolean;
  delay: number;
}

/** Nuvem de contorno grosso, como o resto da marca. */
function Cloud({ x, y, scale, ink, fill, drift, delay }: CloudProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <motion.path
        d="M8 34c-9 0-9-14 1-14 0-11 15-14 20-5 3-9 19-9 21 2 10-1 12 17 0 17Z"
        fill={fill}
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
        animate={drift ? { x: [0, 14, 0] } : { x: 0 }}
        transition={drift ? { duration: 38, ease: "easeInOut", repeat: Infinity, delay } : { duration: 0.3 }}
      />
    </g>
  );
}
