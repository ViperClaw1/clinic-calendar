export interface GeocodeHit {
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
  suggestedName: string;
}

interface AddressComponent {
  long_name: string;
  types: string[];
}

interface GeocodeResult {
  place_id: string;
  formatted_address: string;
  address_components?: AddressComponent[];
  geometry: { location: { lat: number; lng: number } };
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results?: GeocodeResult[];
}

interface TimeZoneResponse {
  status: string;
  timeZoneId?: string;
  errorMessage?: string;
}

const NAME_TYPES = ['point_of_interest', 'establishment', 'premise', 'neighborhood', 'sublocality', 'locality'];

const STATUS_MESSAGE: Record<string, string> = {
  REQUEST_DENIED: 'Google rejected the API key. Enable Geocoding and Time Zone, and check the key restrictions.',
  OVER_QUERY_LIMIT: 'The Google geocoding quota was exceeded. Try again later.',
  INVALID_REQUEST: 'Enter a fuller address.',
  UNKNOWN_ERROR: 'Google geocoding failed. Try again.',
};

export class GeocodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodeError';
  }
}

export const googleMapsKey = (): string => import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** ZERO_RESULTS is an empty list, not a failure. Any other status is. */
export const assertGeocodeStatus = (status: string, errorMessage?: string): void => {
  if (status === 'OK' || status === 'ZERO_RESULTS') return;
  throw new GeocodeError(errorMessage || STATUS_MESSAGE[status] || 'Geocoding failed.');
};

export const parseGeocodeResults = (results: GeocodeResult[]): GeocodeHit[] =>
  results.slice(0, 5).map((result) => {
    const named = result.address_components?.find((component) =>
      component.types.some((type) => NAME_TYPES.includes(type)),
    );
    return {
      placeId: result.place_id,
      address: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      suggestedName: named?.long_name ?? result.formatted_address.split(',')[0],
    };
  });

export const timeZoneIdFrom = (body: TimeZoneResponse): string => {
  if (body.status !== 'OK' || !body.timeZoneId) {
    throw new GeocodeError(body.errorMessage || STATUS_MESSAGE[body.status] || 'Could not determine the time zone.');
  }
  return body.timeZoneId;
};

export const geocodeAddress = async (
  query: string,
  key: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeHit[]> => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', key);
  const response = await fetchImpl(url);
  if (!response.ok) throw new GeocodeError('Google geocoding did not respond.');
  const body = (await response.json()) as GeocodeResponse;
  assertGeocodeStatus(body.status, body.error_message);
  return parseGeocodeResults(body.results ?? []);
};

export const timezoneFor = async (
  latitude: number,
  longitude: number,
  key: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> => {
  const url = new URL('https://maps.googleapis.com/maps/api/timezone/json');
  url.searchParams.set('location', `${latitude},${longitude}`);
  url.searchParams.set('timestamp', String(Math.floor(Date.now() / 1000)));
  url.searchParams.set('key', key);
  const response = await fetchImpl(url);
  if (!response.ok) throw new GeocodeError('Google Time Zone did not respond.');
  return timeZoneIdFrom((await response.json()) as TimeZoneResponse);
};

export const staticMapUrl = (latitude: number, longitude: number, key: string): string => {
  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('center', `${latitude},${longitude}`);
  url.searchParams.set('zoom', '15');
  url.searchParams.set('size', '640x240');
  url.searchParams.set('scale', '2');
  url.searchParams.set('markers', `${latitude},${longitude}`);
  url.searchParams.set('key', key);
  return url.toString();
};
