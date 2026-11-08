// The only place that converts between a location's wall clock and UTC.
// The calendar always shows appointments in the time of their location.

const zonedParts = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    seconds: get('second'),
  };
};

const offsetMs = (instant: Date, timeZone: string): number => {
  const { date, time, seconds } = zonedParts(instant, timeZone);
  const asUtc = Date.parse(`${date}T${time}:${seconds}Z`);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

/** "2030-03-11" + "09:00" in timeZone -> UTC instant. */
export const wallClockToUtc = (date: string, time: string, timeZone: string): Date => {
  const naive = Date.parse(`${date}T${time}:00Z`);
  // The offset depends on the instant being computed, so it is refined once around a DST switch.
  const first = naive - offsetMs(new Date(naive), timeZone);
  return new Date(naive - offsetMs(new Date(first), timeZone));
};

/** UTC instant -> date and "HH:MM" in timeZone. */
export const utcToWallClock = (instant: string | Date, timeZone: string): { date: string; time: string } => {
  const { date, time } = zonedParts(new Date(instant), timeZone);
  return { date, time };
};
