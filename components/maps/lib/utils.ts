import mapboxgl from "mapbox-gl";

// Get the driving route from start to end coordinates using Mapbox Directions API
export const getRoute = async (
  start: [number, number],
  end: [number, number]
) => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX}`
    );
    const data = await res.json();
    return data.routes[0];
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};

// Fetch the current location using the Geolocation API
export const getCurrentLocation = (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
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

// Function to send the location to the server
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

// Function to send the teachers location to the server
export const sendTeacherLocationToServer = async (
  latitude: number,
  longitude: number,
  teacherId: string,
  teacherImage: string,
  teacherName: string
) => {
  try {
    const res = await fetch("/api/teacherlocation", {
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

    if (!res.ok) {
      throw new Error("Failed to send location to the server");
    }
  } catch (error) {
    console.error("Error sending location to server:", error);
  }
};
