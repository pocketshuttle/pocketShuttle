import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import type { TripLocation } from "../types";
import { EmptyState } from "./ui";

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
    <View style={styles.frame}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        region={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
      >
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lng }}
          title="PocketShuttle"
          description={`Updated ${new Date(location.timestamp).toLocaleTimeString()}`}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 270,
    overflow: "hidden",
    borderRadius: 18,
  },
});
