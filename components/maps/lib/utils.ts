import mapboxgl from "mapbox-gl"; // Import Mapbox GL library for interacting with Mapbox APIs
import { useRef } from "react";

/**
 * Get the driving route from the start to end coordinates using the Mapbox Directions API.
 * This function requests directions using the 'driving' profile and returns a route in GeoJSON format.
 *
 * @param start - Starting coordinates as a tuple [longitude, latitude]
 * @param end - Ending coordinates as a tuple [longitude, latitude]
 * @returns A promise resolving to the first route from the Mapbox Directions API response or null in case of an error
 */
export const getRoute = async (
  start: [number, number],
  end: [number, number]
) => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX}`
    );
    const data = await res.json();
    return data.routes[0]; // Return the first route from the response
  } catch (error) {
    console.error("Error fetching route:", error);
    return null; // Return null if there was an error
  }
};

export const getGoogleMapsRoute = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<google.maps.DirectionsResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.google) {
      reject(new Error("Google Maps not loaded"));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.log(result)
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          console.error("Directions request failed:", status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
};

const checkPermissions = async () => {
  if (navigator.permissions) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state;
    } catch (e) {
      console.error("Permission query failed", e);
    }
  }
  return "unknown";
};

/**
 * Fetch the current location using the browser's Geolocation API.
 * This function continuously watches the user's location with high accuracy and resolves the current coordinates.
 *
 * @returns A promise resolving to the current location coordinates as a tuple [longitude, latitude]
 */
export const getCurrentLocation = async (
  options?: PositionOptions,
  retries = 1
): Promise<[number, number]> => {
  try {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported");
    }

    const permission = await checkPermissions();
    if (permission === "denied") {
      const error = new Error("Location permission denied at browser level");
      (error as Error & { code?: number }).code = 1;
      throw error;
    }

    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        (err) => {
          if (retries > 0) {
            setTimeout(
              () =>
                getCurrentLocation(options, retries - 1)
                  .then(resolve)
                  .catch(reject),
              1000
            );
          } else {
            const error = new Error(`Location error: ${err.message}`);
            (error as Error & { code?: number }).code = err.code;
            reject(error);
          }
        },
        {
          // enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
          ...options,
        }
      );
    });
  } catch (error: any) {
    if (error?.code !== 1) {
      console.error("Location fetch failed:", error);
    }
    throw error;
  }
};

/**
 * Fetch the school location using the browser's Geolocation API.
 * This function fetches the current location (no continuous updates, unlike `getCurrentLocation`).
 *
 * @returns A promise resolving to the current location coordinates as a tuple [longitude, latitude]
 */
type Coordinates = [number, number]; // [lat, lng]

export const getSchoolLocation = async (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // console.error("Geolocation is not supported by this browser.");
      return reject(new Error("Geolocation not supported"));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // console.log("Location success", pos);
        const { latitude, longitude } = pos.coords;
        resolve([longitude, latitude]);
      },
      (err) => {
        console.error("Geolocation error object:", err);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Fetch the coordinates for a given address using the Mapbox Geocoding API.
 *
 * @param address - The address to geocode
 * @returns A promise resolving to the coordinates [longitude, latitude] of the address, or null if no results are found
 */
export const fetchCoordinates = async (address: string) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();
    if (data && data.features && data.features.length > 0) {
      return data.features[0].center; // Return the first result's coordinates (longitude, latitude)
    }
    return null; // Return null if no features are found
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null; // Return null if an error occurs
  }
};

export const googleFetchCoordinates = async (
  address: string
): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return [location.lat, location.lng];
    }

    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

/**
 * Send the user's location to the server via an API POST request.
 *
 * @param latitude - The latitude to send
 * @param longitude - The longitude to send
 * @returns A promise that resolves when the location is successfully sent, or logs an error on failure
 */
export const sendLocationToServer = async (
  latitude: number,
  longitude: number
) => {
  try {
    const response = await fetch("/api/bustracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latitude, longitude }), 
    });

    if (!response.ok) {
      throw new Error("Failed to send location to the server"); 
    }
  } catch (error) {
    console.error("Error sending location to server:", error); 
  }
};

/**
 * Send the teacher's location, along with teacher details, to the server via an API POST request.
 *
 * @param latitude - The latitude of the teacher's location
 * @param longitude - The longitude of the teacher's location
 * @param teacherId - The teacher's unique ID
 * @param teacherImage - The teacher's profile image URL
 * @param teacherName - The teacher's name
 * @returns A promise that resolves when the location is successfully sent, or logs an error on failure
 */

const MAX_RETRIES = 3;
let retryCount = 0;

export const sendTeacherLocationToServer = async (
  latitude: number,
  longitude: number,
  teacherId: string,
  teacherImage: string,
  teacherName: string
): Promise<void> => {
  // console.log("Sending teacher location to server:", latitude);
  try {
    const res = await fetch("/api/bustracking/teachers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude,
        longitude,
        teacherId,
        teacherImage,
        teacherName,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      // console.warn(`Retrying to send location (attempt ${retryCount})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)); // Wait 1 second before retrying
      return sendTeacherLocationToServer(
        latitude,
        longitude,
        teacherId,
        teacherImage,
        teacherName
      );
    }
    console.error("Error sending location to server:", error);
  }
};

type LocationInput = string | { lat: number; lng: number };

export function getETA(
  origin: LocationInput,
  destination: LocationInput,
  mode?: google.maps.TravelMode
): Promise<{
  distance: string;
  duration: string;
  durationValue: number;
} | null> {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error("Google Maps JS SDK not loaded"));
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: mode ?? window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (
          status === "OK" &&
          response?.rows[0]?.elements[0]?.status === "OK"
        ) {
          const element = response.rows[0].elements[0];
          resolve({
            distance: element.distance?.text || "",
            duration: element.duration?.text || "",
            durationValue: element.duration?.value || 0,
          });
        } else {
          console.error("DistanceMatrix failed:", status, response);
          resolve(null);
        }
      }
    );
  });
}
