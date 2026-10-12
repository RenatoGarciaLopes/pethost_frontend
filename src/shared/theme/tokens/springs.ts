/** Settling spring from design/06-movimento. Use for UI; never overshoots. */
export const SPRING_ASSENTAR = {
  duration: 340,
  easing:
    "linear(0, 0.026, 0.085, 0.156, 0.235, 0.322, 0.401, 0.481, 0.548, 0.61, 0.669, 0.717, 0.76, 0.799, 0.831, 0.857, 0.882, 0.902, 0.918, 0.933, 0.944, 0.955, 0.962, 0.969, 0.975, 0.979, 0.983, 0.986, 0.989, 0.991, 0.993, 0.994, 0.995, 0.996, 0.997, 0.998, 1)",
} as const;
/** Welcoming spring, only for isolated decorative highlights (never buttons/status). */
export const SPRING_ACOLHER = {
  duration: 660,
  easing:
    "linear(0, 0.037, 0.129, 0.245, 0.375, 0.514, 0.638, 0.75, 0.851, 0.929, 0.989, 1.035, 1.064, 1.081, 1.089, 1.088, 1.083, 1.073, 1.062, 1.05, 1.038, 1.027, 1.018, 1.01, 1.003, 0.999, 0.995, 0.993, 0.992, 0.992, 0.992, 0.993, 0.994, 0.995, 0.996, 0.997, 1)",
} as const;
