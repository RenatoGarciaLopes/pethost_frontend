/**
 * Os dias como a API escreve, de segunda a domingo. Fora do `WeekdayPicker` (que é `"use client"`): valor exportado
 * de módulo de cliente chega ao servidor como referência, não como o array, e quebra os contratos lidos no servidor.
 *
 * @example z.array(z.enum(WEEKDAY_VALUES));
 */
export const WEEKDAY_VALUES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAY_VALUES)[number];
