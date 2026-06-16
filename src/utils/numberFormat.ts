// src/utils/numberFormat.ts

export function formatScore(score: number | string | undefined | null, decimals = 1): string {
  if (score === null || score === undefined || score === '') return '';
  const num = Number(score);
  if (isNaN(num)) return String(score);
  return num.toFixed(decimals).replace('.', ',');
}

export function formatPercent(val: number | string | undefined | null, decimals = 1): string {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toFixed(decimals).replace('.', ',');
}
