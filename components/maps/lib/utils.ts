import mapboxgl from "mapbox-gl";

// Get the driving route from start to end coordinates using Mapbox Directions API
export const getRoute = async (
  start: [number, number],
  end: [number, number]
) => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX}`
    );
    const data = await res.json();
    return data.routes[0];
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};

// (2) [7.4481664, 9.060352]
// [7.4481664, 9.060352]
// [7.3518792, 9.1717901]
// Fetch the current location using the Geolocation API
export const getCurrentLocation = (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Current location:", [longitude, latitude]);
          resolve([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting current location:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
};

const address2 = "Lagos, NG";

// Fetch coordinates for an address using Mapbox Geocoding API
export const fetchCoordinates = async (address: string) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();
    if (data && data.features && data.features.length > 0) {
      return data.features[0].center; // Longitude, Latitude format
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};
