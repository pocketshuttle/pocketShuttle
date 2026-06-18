import "server-only";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodedAddress = Coordinates & {
  formattedAddress?: string;
};

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const coords = value as Record<string, unknown>;
  return (
    typeof coords.latitude === "number" &&
    Number.isFinite(coords.latitude) &&
    typeof coords.longitude === "number" &&
    Number.isFinite(coords.longitude)
  );
}

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function geocodeAddress(address: string): Promise<GeocodedAddress> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    throw new Error("School address is required");
  }

  if (!key) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = new URL(GOOGLE_GEOCODE_URL);
  url.searchParams.set("address", trimmedAddress);
  url.searchParams.set("key", key);

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  const firstResult = data?.results?.[0];
  const location = firstResult?.geometry?.location;

  if (!response.ok || data?.status !== "OK" || !location) {
    throw new Error("We could not locate this school address. Please enter a more specific address.");
  }

  const geocodedAddress: GeocodedAddress = {
    latitude: Number(location.lat),
    longitude: Number(location.lng),
  };

  if (typeof firstResult.formatted_address === "string") {
    geocodedAddress.formattedAddress = firstResult.formatted_address;
  }

  return geocodedAddress;
}
