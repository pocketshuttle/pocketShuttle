import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MobileTrip } from "../types";
import { colors } from "../theme";
import { Card, EmptyState, StatusPill, textStyles } from "./ui";

export function TripList({
  trips,
  emptyMessage,
}: {
  trips: MobileTrip[];
  emptyMessage: string;
}) {
  const router = useRouter();
  if (!trips.length) {
    return <EmptyState title="No trips here" message={emptyMessage} />;
  }
  return (
    <View style={styles.list}>
      {trips.map((trip) => (
        <Pressable
          key={trip.id}
          onPress={() => router.push(`/trip/${trip.id}`)}
        >
          <Card>
            <View style={styles.row}>
              <Text style={textStyles.cardTitle}>{trip.title}</Text>
              <StatusPill
                label={trip.status}
                danger={
                  trip.status === "emergency" ||
                  trip.safetyState === "emergency"
                }
              />
            </View>
            <Text style={textStyles.muted}>
              {trip.tripType.replaceAll("_", " ")} · updated{" "}
              {new Date(trip.updatedAt).toLocaleString()}
            </Text>
            {trip.locations[0] ? (
              <Text style={textStyles.body}>
                Latest location received{" "}
                {new Date(trip.locations[0].timestamp).toLocaleTimeString()}
              </Text>
            ) : null}
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
});
