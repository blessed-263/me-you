/** Editorial labels & imagery per mock ticket type */
export const TICKET_VISUALS: Record<
  string,
  { part: string; image: string; time: string }
> = {
  tt_harvest_table: {
    part: 'Part I',
    image: '/images/harvest-table.png',
    time: '11:00 – 14:30',
  },
  tt_after_lunch: {
    part: 'Part II',
    image: '/images/event-dj.png',
    time: '15:00 – 20:00',
  },
  tt_full_day: {
    part: 'Full journey',
    image: '/images/_DSC6449.jpg',
    time: '11:00 – late',
  },
};

export function ticketImageForId(ticketId: string, fallback: string): string {
  return TICKET_VISUALS[ticketId]?.image ?? fallback;
}

export function ticketPartFromType(ticketType: string): string {
  const normalized = ticketType.toLowerCase();
  if (normalized.includes('harvest')) return 'Part I';
  if (normalized.includes('after')) return 'Part II';
  if (normalized.includes('full')) return 'Full journey';
  return 'Ticket';
}
