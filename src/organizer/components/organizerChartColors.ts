/** Distinct, on-brand chart colors — enough contrast between adjacent segments. */
export const ORGANIZER_CHART_PALETTE = [
  '#5a5a40',
  '#c17f59',
  '#2f6760',
  '#8b6914',
  '#6b4c7a',
  '#4a6fa5',
  '#9c4a5a',
  '#3d6b4f',
  '#b8860b',
  '#5c4033',
] as const;

export function chartColor(index: number): string {
  return ORGANIZER_CHART_PALETTE[index % ORGANIZER_CHART_PALETTE.length];
}
