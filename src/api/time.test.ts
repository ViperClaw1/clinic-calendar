import { describe, expect, it } from 'vitest';
import { utcToWallClock, wallClockToUtc } from './time';

const NY = 'America/New_York'; // DST 2030: starts Mar 10, ends Nov 3

describe('wallClockToUtc', () => {
  it('uses the offset of the date, not of today', () => {
    expect(wallClockToUtc('2030-03-04', '09:00', NY).toISOString()).toBe('2030-03-04T14:00:00.000Z');
    expect(wallClockToUtc('2030-03-11', '09:00', NY).toISOString()).toBe('2030-03-11T13:00:00.000Z');
  });

  it('is correct on the day of each switch', () => {
    expect(wallClockToUtc('2030-03-10', '09:00', NY).toISOString()).toBe('2030-03-10T13:00:00.000Z');
    expect(wallClockToUtc('2030-11-03', '09:00', NY).toISOString()).toBe('2030-11-03T14:00:00.000Z');
  });

  it('handles zones east of UTC across midnight', () => {
    expect(wallClockToUtc('2030-01-07', '01:00', 'Asia/Tokyo').toISOString()).toBe('2030-01-06T16:00:00.000Z');
  });
});

describe('utcToWallClock', () => {
  it('returns the date of the location, not of UTC', () => {
    expect(utcToWallClock('2030-01-08T02:00:00Z', NY)).toEqual({ date: '2030-01-07', time: '21:00' });
  });

  it('renders midnight as 00:00', () => {
    expect(utcToWallClock('2030-01-07T05:00:00Z', NY)).toEqual({ date: '2030-01-07', time: '00:00' });
  });

  it('round-trips', () => {
    for (const [date, time] of [['2030-03-11', '08:15'], ['2030-11-04', '20:45']]) {
      expect(utcToWallClock(wallClockToUtc(date, time, NY), NY)).toEqual({ date, time });
    }
  });
});
