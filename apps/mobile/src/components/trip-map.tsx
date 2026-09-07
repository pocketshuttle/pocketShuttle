import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import type { TripLocation } from "../types";
import { EmptyState } from "./ui";

export function LocationMap({
  latitude,
  longitude,
  title = "PocketShuttle",
  description,
  height = 270,
}: {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  height?: number;
}) {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
  return (
    <View style={[styles.frame, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        region={region}
      >
        <Marker coordinate={{ latitude, longitude }} title={title} description={description} />
      </MapView>
    </View>
  );
}

export function TripMap({ location }: { location?: TripLocation | null }) {
  if (!location) {
    return (
      <EmptyState
        title="Waiting for location"
        message="The map will update when the active driver shares a location."
      />
    );
  }
  return (
    <LocationMap
      latitude={location.lat}
      longitude={location.lng}
      description={`Updated ${new Date(location.timestamp).toLocaleTimeString()}`}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderRadius: 18,
  },
});
