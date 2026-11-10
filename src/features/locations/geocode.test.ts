import { describe, expect, it } from 'vitest';
import { assertGeocodeStatus, GeocodeError, parseGeocodeResults, timeZoneIdFrom } from './geocode';

const place = {
  place_id: 'abc',
  formatted_address: '1 Main St, Springfield, IL, USA',
  address_components: [
    { long_name: '1', types: ['street_number'] },
    { long_name: 'Springfield', types: ['locality', 'political'] },
  ],
  geometry: { location: { lat: 39.78, lng: -89.65 } },
};

describe('parseGeocodeResults', () => {
  it('keeps the first five results and names the place from its locality', () => {
    const hits = parseGeocodeResults(Array.from({ length: 6 }, (_, index) => ({ ...place, place_id: String(index) })));
    expect(hits).toHaveLength(5);
    expect(hits[0]).toMatchObject({
      placeId: '0',
      address: '1 Main St, Springfield, IL, USA',
      latitude: 39.78,
      longitude: -89.65,
      suggestedName: 'Springfield',
    });
  });

  it('falls back to the first line of the formatted address', () => {
    const [hit] = parseGeocodeResults([{ ...place, address_components: [] }]);
    expect(hit.suggestedName).toBe('1 Main St');
  });
});

describe('assertGeocodeStatus', () => {
  it('treats an empty result set as success', () => {
    expect(() => assertGeocodeStatus('ZERO_RESULTS')).not.toThrow();
    expect(() => assertGeocodeStatus('OK')).not.toThrow();
  });

  it('uses the message Google sent', () => {
    expect(() => assertGeocodeStatus('REQUEST_DENIED', 'The provided API key is invalid.')).toThrow(GeocodeError);
    expect(() => assertGeocodeStatus('REQUEST_DENIED', 'The provided API key is invalid.')).toThrow(
      'The provided API key is invalid.',
    );
  });
});

describe('timeZoneIdFrom', () => {
  it('returns the IANA id', () => {
    expect(timeZoneIdFrom({ status: 'OK', timeZoneId: 'America/Chicago' })).toBe('America/Chicago');
  });

  it('rejects a result without a zone', () => {
    expect(() => timeZoneIdFrom({ status: 'ZERO_RESULTS' })).toThrow(GeocodeError);
  });
});
