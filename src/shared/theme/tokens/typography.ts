/** Local next/font variables; CSS fallbacks also support Storybook without Next's loader. */
export const quintalTypography = {
  fontFamily: "var(--font-body, 'Atkinson Hyperlegible Next'), sans-serif",
  fontSize: 17,
  body1: { fontSize: "1.0625rem", lineHeight: 1.6 },
  body2: { fontSize: "1rem", lineHeight: 1.5 },
  h1: { fontFamily: "var(--font-display, 'Caprasimo'), serif", fontWeight: 400, fontSize: "clamp(2.5rem, 6vw, 4rem)" },
  h2: { fontFamily: "var(--font-display, 'Caprasimo'), serif", fontWeight: 400, fontSize: "2.5rem" },
  h3: { fontFamily: "var(--font-display, 'Caprasimo'), serif", fontWeight: 400, fontSize: "2rem" },
  h4: { fontFamily: "var(--font-display, 'Caprasimo'), serif", fontWeight: 400, fontSize: "1.5rem" },
  button: { fontSize: "1.0625rem", fontWeight: 700, textTransform: "none" as const },
};
