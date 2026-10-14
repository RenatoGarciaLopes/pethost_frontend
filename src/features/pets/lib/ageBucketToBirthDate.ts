/** Converte idade aproximada para o primeiro dia do mês, usando a data local. @example ageBucketToBirthDate("puppy", new Date(2026, 9, 14)) // "2026-04-01" */
export function ageBucketToBirthDate(bucket: "puppy" | "young" | "adult" | "senior", today: Date): string {
  const months = { puppy: 6, young: 24, adult: 60, senior: 120 }[bucket];
  const date = new Date(today.getFullYear(), today.getMonth() - months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
