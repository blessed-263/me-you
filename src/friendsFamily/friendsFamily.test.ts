import { describe, expect, it } from 'vitest';
import { EMPTY_FORM, normaliseSaMobile, validateForm } from './content.ts';
import { filterRows, toCsv, totals, type FfRsvp } from './organiserData.ts';
import { getRouteSeo } from '../lib/seo.ts';

describe('Friends & Family form validation', () => {
  it('shows all five messages on an empty submit', () => {
    expect(validateForm(EMPTY_FORM)).toEqual({
      firstName: 'Please add your first name.',
      surname: 'Please add your surname.',
      mobile: 'Please add your mobile number.',
      email: 'Please add your email address.',
      attending: 'Please let us know if you can make it.',
    });
  });

  it('accepts SA mobiles and saves them as +27', () => {
    expect(normaliseSaMobile('082 123 4567')).toBe('+27821234567');
    expect(normaliseSaMobile('+27 82 123 4567')).toBe('+27821234567');
    expect(normaliseSaMobile('0821234567')).toBe('+27821234567');
    expect(normaliseSaMobile('(082) 123-4567')).toBe('+27821234567');
    expect(normaliseSaMobile('012 345 6789')).toBeNull();
    expect(normaliseSaMobile('+1 555 123 4567')).toBeNull();
  });

  it('rejects emails without @ or a dot after it', () => {
    const base = { ...EMPTY_FORM, firstName: 'A', surname: 'B', mobile: '0821234567', attending: true };
    expect(validateForm({ ...base, email: 'name.example.com' }).email).toBe('Please check your email address.');
    expect(validateForm({ ...base, email: 'name@example' }).email).toBe('Please check your email address.');
    expect(validateForm({ ...base, email: 'name@example.com' })).toEqual({});
  });
});

const row = (over: Partial<FfRsvp>): FfRsvp => ({
  id: '1',
  firstName: 'Test',
  surname: 'Delete-Me',
  mobile: '+27600000001',
  email: 'test1@example.com',
  attending: true,
  status: 'pending',
  arrived: false,
  checkedInAt: null,
  createdAt: '2026-11-16T10:00:00.000Z',
  updatedAt: '2026-11-16T10:00:00.000Z',
  ...over,
});

describe('Friends & Family organiser data', () => {
  const rows = [
    row({}),
    row({ id: '2', firstName: 'Second', attending: false, status: 'declined', mobile: '+27600000002', email: 'test2@example.com' }),
    row({ id: '3', firstName: 'Third', status: 'approved', arrived: true, checkedInAt: '2026-11-22T11:00:00.000Z', email: 'test3@example.com' }),
  ];

  it('totals count every row', () => {
    expect(totals(rows)).toEqual({ responses: 3, attending: 2, notAttending: 1, pending: 1, arrived: 1 });
  });

  it('filters and search combine', () => {
    expect(filterRows(rows, 'yes', 'all', '').map((r) => r.id)).toEqual(['1', '3']);
    expect(filterRows(rows, 'all', 'arrived', '').map((r) => r.id)).toEqual(['3']);
    expect(filterRows(rows, 'yes', 'approved', 'third').map((r) => r.id)).toEqual(['3']);
    expect(filterRows(rows, 'all', 'all', '060 000 0002').map((r) => r.id)).toEqual(['2']);
    expect(filterRows(rows, 'no', 'all', 'test1@')).toEqual([]);
  });

  it('CSV quotes every value, uses SAST and guards formulas', () => {
    const csv = toCsv([row({ firstName: '=HYPERLINK("x")', checkedInAt: null })]);
    const [header, line] = csv.split('\r\n');
    expect(header).toBe(
      '"First name","Surname","Mobile","Email","Attending","Status","First received (SAST)","Last updated (SAST)","Checked in (SAST)"',
    );
    expect(line).toBe(
      `"'=HYPERLINK(""x"")","Delete-Me","+27600000001","test1@example.com","Yes","Pending","2026-11-16 12:00","2026-11-16 12:00",""`,
    );
  });
});

describe('Friends & Family SEO', () => {
  it('is noindex and never puts the token in the canonical path', () => {
    const seo = getRouteSeo('/ff/super-secret-token-123');
    expect(seo.robots).toBe('noindex,nofollow');
    expect(seo.path).toBe('/ff');
  });
});
