/** Corner radii in pixels; use the named value in MUI styles instead of its numeric multiplier. */
export const quintalRadii = { control: 12, media: 16, field: 18, card: 24, pill: 999 } as const;

/** CSS values for sx styles: MUI does not multiply these strings by shape.borderRadius. */
export const quintalRadiusCss = {
  control: "12px",
  media: "16px",
  field: "18px",
  card: "24px",
  pill: "999px",
} as const;

/**
 * Converts a named Quintal radius to CSS pixels.
 * @example radius("card") // "24px"
 */
export function radius(name: keyof typeof quintalRadii): (typeof quintalRadiusCss)[keyof typeof quintalRadiusCss] {
  return quintalRadiusCss[name];
}
