/** A turma da PetHost (vault `marca/06-a-turma.md`): sempre felizes, sempre em volta da marca, nunca no logo. */
export type TurmaMember = "corgi" | "golden" | "pastor";

/** Ordem padrão de entrada. */
export const TURMA_MEMBERS: readonly TurmaMember[] = ["corgi", "golden", "pastor"];

/** WebP animado (ciclo de caminhada, fundo transparente) servido de `public/brand/turma/`. */
export function turmaSrc(member: TurmaMember): string {
  return `/brand/turma/${member}.webp`;
}

/** Proporção dos WebP (320 × 238). */
export const TURMA_ASPECT = 320 / 238;
