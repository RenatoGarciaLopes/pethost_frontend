/** Corner radii in pixels; use the named value in MUI styles instead of its numeric multiplier. */
export const quintalRadii = { control: 12, media: 16, field: 18, card: 24, pill: 999 } as const;

/**
 * Converts a named Quintal radius to CSS pixels.
 * @example radius("card") // 24
 */
export function radius(name: keyof typeof quintalRadii): number {
  return quintalRadii[name];
}
