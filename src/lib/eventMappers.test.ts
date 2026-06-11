import { describe, expect, it } from 'vitest';
import { mapBackendEventToMockEvent } from './eventMappers.ts';

describe('mapBackendEventToMockEvent', () => {
  it('maps backend payload fields into ui event shape', () => {
    const mapped = mapBackendEventToMockEvent({
      id: 'evt_1',
      title: 'You & Me',
      subtitle: 'Second edition',
      date: '2026-05-31T11:00:00.000Z',
      venue: 'Primedia Rooftop',
      ticket_types: [{ id: 'tt_1', name: 'General', price: 500 }],
    });

    expect(mapped.id).toBe('evt_1');
    expect(mapped.title).toBe('You & Me');
    expect(mapped.subtitle).toBe('Second edition');
    expect(mapped.ticketTypes[0].id).toBe('tt_1');
    expect(mapped.ticketTypes[0].price).toBe(500);
  });
});
