import type { ReactElement } from "react";
import type { DocumentKind } from "../../../types";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Frente: o cartão com o retrato e as linhas de dados. */
function FrontDrawing() {
  return (
    <svg viewBox="0 0 150 100" {...stroke}>
      <rect x="6" y="8" width="138" height="84" rx="12" />
      <rect x="18" y="24" width="34" height="44" rx="6" />
      <circle cx="35" cy="40" r="8" />
      <path d="M24 64c3-8 19-8 22 0M64 30h62M64 44h48M64 58h56M18 80h108" />
    </svg>
  );
}

/** Verso: linhas de dados e o código de barras. */
function BackDrawing() {
  return (
    <svg viewBox="0 0 150 100" {...stroke}>
      <rect x="6" y="8" width="138" height="84" rx="12" />
      <path d="M20 26h110M20 40h84M20 54h96" />
      <path d="M22 68v14M30 68v14M35 68v14M44 68v14M50 68v14M58 68v14M63 68v14M72 68v14M80 68v14M86 68v14" />
    </svg>
  );
}

/** Selfie: o rosto e a mão segurando o documento ao lado. */
function SelfieDrawing() {
  return (
    <svg viewBox="0 0 150 100" {...stroke}>
      <circle cx="52" cy="38" r="20" />
      <path d="M45 34h.01M59 34h.01M45 46c4 4 10 4 14 0" />
      <path d="M18 96c4-20 18-30 34-30s30 10 34 30" />
      <rect x="92" y="38" width="48" height="32" rx="6" />
      <path d="M100 50h14M100 60h26M86 74c4-4 8-6 12-4" />
    </svg>
  );
}

/** O desenho do que se espera em cada vaga (REQ-HVER-006); decorativo, a dica diz em texto. */
export const documentDrawings: Readonly<Record<DocumentKind, ReactElement>> = {
  front: <FrontDrawing />,
  back: <BackDrawing />,
  selfie: <SelfieDrawing />,
};
