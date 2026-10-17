"use client";

import { Box, useTheme } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { MOTION_ACOLHER } from "@/shared/theme/tokens/springs";
import { DaisyGlyph } from "../Daisy";
import { TurmaWalker } from "../TurmaWalker";
import { usePointerParallax } from "./usePointerParallax";
import { useDoorTarget } from "./useDoorTarget";

const nudge = keyframes`0%, 70%, 100% { transform: scaleX(1); } 80% { transform: scaleX(.84); } 91% { transform: scaleX(1.03); }`;

/**
 * Variante interna house da DoorScene (REQ-UIC-009), viewBox 520×300 da prancha: casa, cerca e turma.
 * Três planos de parallax; flores fogem do ponteiro; porta abre no hover e recebe o desfile a cada 1,333 s.
 * Sem foco/ações de negócio. Movimento reduzido mantém dois cães estáticos e desliga todos os planos.
 */
export function HouseScene() {
  const { palette } = useTheme();
  const reduced = usePrefersReducedMotion();
  const pointer = usePointerParallax(!reduced);
  const skyX = useTransform(pointer.x, (value) => value * -16);
  const sceneX = useTransform(pointer.x, (value) => value * 8);
  const pollenX = useTransform(pointer.x, (value) => value * 22);
  const pollenY = useTransform(pointer.y, (value) => value * 11);
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const [hovered, setHovered] = useState(false);
  const form = useDoorTarget(true);
  const open = hovered || form.engaged;
  const ink = palette.quintal.tinta;
  const paper = palette.background.paper;

  return (
    <Box aria-hidden="true" sx={{ width: "100%", userSelect: "none", color: "text.primary" }}>
      <svg
        viewBox="0 0 520 300"
        width="100%"
        focusable="false"
        style={{ display: "block", overflow: "visible" }}
        onPointerDown={(event) => event.preventDefault()}
        onPointerMove={(event) => {
          if (reduced || event.pointerType === "touch") return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (rect.width) {
            cursorX.set(((event.clientX - rect.left) * 520) / rect.width);
            cursorY.set(((event.clientY - rect.top) * 300) / rect.height);
          }
        }}
        onPointerLeave={() => {
          cursorX.set(-1000);
          cursorY.set(-1000);
        }}
      >
        <motion.g
          style={{ x: reduced ? 0 : skyX }}
          fill={paper}
          stroke={ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g transform="translate(16 5)">
            <motion.path
              d="M0 42c-15-2-12-20 0-21-1-19 24-27 35-13 12-18 39-7 36 10 16-1 23 24 7 24Z"
              animate={{ x: reduced ? 0 : [0, 14, 0] }}
              transition={{ duration: 38, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
            />
          </g>
          <g transform="translate(432 48) scale(.65)">
            <motion.path
              d="M0 30c-10-1-12-16 0-18 1-16 20-20 28-8 13-8 24 1 23 10 12-3 19 16 7 16Z"
              animate={{ x: reduced ? 0 : [0, -12, 0] }}
              transition={{ duration: 38, repeat: reduced ? 0 : Infinity, ease: "easeInOut", delay: reduced ? 0 : 4 }}
            />
          </g>
          <circle cx="112" cy="66" r="24" fill={palette.quintal.gema} />
          <path d="M112 30v-10m0 82v10m-36-46H65m84 0h10m-72-25-8-8m58 58 8 8m-58-8-8 8m58-58 8-8" />
        </motion.g>

        <motion.g
          data-house
          style={{ x: reduced ? 0 : sceneX }}
          stroke={ink}
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <path d="M285 141h195l-1 143H286Z" fill={paper} />
          <path d="m267 142 116-77 117 77-16 1-102-2-100 2Z" fill={palette.quintal.gema} />
          <path d="m302 130 36-24m9 24 38-25m11 24 35-24m9 25 29-18" fill="none" strokeWidth="1.8" />
          <path d="M306 284v-55c0-26 14-39 32-39s31 15 31 39v55Z" fill={palette.scene.doorLight} />
          <path d="M412 171h43l-1 44h-42Z" fill={palette.quintal.ceu} fillOpacity=".35" />
          <path d="M433 171v44m-21-22h42m-45 27h49" fill="none" />
          <motion.g
            animate={{ rotate: reduced ? 0 : [-3, 3, -3] }}
            style={{ transformBox: "fill-box", originX: 0.5, originY: 0 }}
            transition={{ duration: 3.1, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
          >
            <path d="m412 215 3 8h37l3-8Z" fill={palette.scene.ground} />
            <path d="M420 216v-8m13 8v-10m13 10v-8" />
            <circle cx="420" cy="207" r="3" fill={palette.quintal.coral} />
            <circle cx="433" cy="205" r="3" fill={palette.quintal.gema} />
            <circle cx="446" cy="207" r="3" fill={palette.quintal.ceu} />
          </motion.g>

          <g fill="none">
            <path d="M18 248c67 2 155-3 270 0m-270 24c80-3 171 2 270-1" />
            {[28, 61, 94, 127, 160, 193, 226, 259, 285].map((x) => (
              <g key={x}>
                <path d={`M${x} 282v-50`} stroke={paper} strokeWidth="8" />
                <path d={`M${x} 282v-50`} strokeWidth="2.4" />
              </g>
            ))}
          </g>
          <foreignObject
            x="0"
            y="225"
            width="344"
            height="60"
            style={{ overflow: "hidden", maskImage: "linear-gradient(to right, transparent, black 12%, black)" }}
          >
            <TurmaWalker
              members={reduced ? ["golden", "pastor"] : undefined}
              dogHeight={60}
              crossingMs={4000}
              intervalMs={1333}
            />
          </foreignObject>
          <motion.g
            data-house-leaf
            style={{ transformBox: "fill-box", originX: 1, originY: 0.5 }}
            animate={{ scaleX: !reduced && open ? 0.6 : 1 }}
            transition={reduced ? { duration: 0 } : MOTION_ACOLHER}
          >
            <Box
              component="g"
              sx={{
                transformBox: "fill-box",
                transformOrigin: "right center",
                animation: reduced || open ? "none" : `${nudge} 1333ms ease-in-out 4000ms infinite`,
              }}
            >
              <path d="M338 284v-55c0-26 10-39 16-39s15 14 15 39v55Z" fill={palette.quintal.coral} />
              <circle cx="345" cy="256" r="2.5" fill={ink} />
            </Box>
          </motion.g>
          <circle cx="487" cy="277" r="8" fill={palette.quintal.ceu} />
          <path d="m481 275 8 3 5-4" fill="none" />
        </motion.g>

        <HouseFlower x={33} y={228} scale={0.9} petal="branco" cursorX={cursorX} cursorY={cursorY} reduced={reduced} />
        <HouseFlower x={88} y={251} scale={0.55} petal="ceu" cursorX={cursorX} cursorY={cursorY} reduced={reduced} />
        <HouseFlower x={493} y={228} scale={0.9} petal="coral" cursorX={cursorX} cursorY={cursorY} reduced={reduced} />
        <motion.g
          style={{ x: reduced ? 0 : pollenX, y: reduced ? 0 : pollenY }}
          stroke={ink}
          strokeWidth="1"
          pointerEvents="none"
        >
          {[
            { x: 10, y: 122 },
            { x: 197, y: 33 },
            { x: 210, y: 181 },
            { x: 480, y: 17 },
            { x: 506, y: 200 },
          ].map((dot, index) => (
            <motion.circle
              key={dot.x}
              cx={dot.x}
              cy={dot.y}
              r={index % 2 ? 2 : 3}
              fill={index % 2 ? paper : palette.quintal.gema}
              animate={{ y: reduced ? 0 : [0, -10, 0], rotate: reduced ? 0 : [0, 30, 0] }}
              transition={{
                duration: 9,
                repeat: reduced ? 0 : Infinity,
                delay: reduced ? 0 : index * 0.7,
                ease: "easeInOut",
              }}
            />
          ))}
          <path d="m173 149 8 8m-8 0 8-8m-4-2v12m319 76 8 8m-8 0 8-8m-4-2v12" />
        </motion.g>
      </svg>
    </Box>
  );
}

/** Flor interna: distância em coordenadas SVG, inclinação oposta ao cursor até 20°, raio 110. */
function HouseFlower({
  x,
  y,
  scale,
  petal,
  cursorX,
  cursorY,
  reduced,
}: {
  x: number;
  y: number;
  scale: number;
  petal: "branco" | "ceu" | "coral";
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  reduced: boolean;
}) {
  const angle = useTransform([cursorX, cursorY], ([pointerX, pointerY]) => {
    const dx = Number(pointerX) - (x + 20 * scale);
    const distance = Math.hypot(dx, Number(pointerY) - (y + 20 * scale));
    return reduced || distance > 110 ? 0 : -Math.sign(dx) * 20 * (1 - distance / 110);
  });
  const tilt = useSpring(angle, { stiffness: 180, damping: 12 });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <motion.g style={{ rotate: reduced ? 0 : tilt, transformBox: "fill-box", originX: 0.5, originY: 1 }}>
        <motion.g
          style={{ transformBox: "fill-box", originX: 0.5, originY: 1 }}
          animate={{ rotate: reduced ? 0 : [-4, 5, -4] }}
          transition={{ duration: 2.3 + scale, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          <DaisyGlyph petal={petal} />
        </motion.g>
      </motion.g>
    </g>
  );
}
