/** Relative luminance of an opaque RGB hex color (WCAG sRGB formula). */
function luminance(hex: string): number {
  if (!/^#([\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error("Expected an RGB hex color");
  const rgb =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((digit) => digit.repeat(2))
          .join("")
      : hex.slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(rgb.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

/**
 * WCAG contrast of two opaque #RGB/#RRGGBB colors (1–21). Not for translucent colors.
 * @param foreground - Foreground RGB hex.
 * @param background - Background RGB hex.
 * @example contrastRatio("#1F1A17", "#F26B3A")
 */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
