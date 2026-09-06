import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  StatusPill,
  textStyles,
} from "../../src/components/ui";
import { useDashboard } from "../../src/hooks/use-dashboard";
import {
  activeTrackingTripId,
  startDriverTracking,
  stopDriverTracking,
} from "../../src/services/location";
import { sendOrQueueMobileEvent } from "../../src/services/offline-queue";
import { useEffect, useState } from "react";

export default function DriverHome() {
  const query = useDashboard("driver");
  const queryClient = useQueryClient();
  const [trackingTripId, setTrackingTripId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void activeTrackingTripId().then(setTrackingTripId);
  }, []);

  if (query.isLoading) return <LoadingState label="Loading assignments…" />;
  if (!query.data) {
    return (
      <Screen>
        <Header title="Driver" />
        <EmptyState title="Unable to load" message="Check your connection." />
      </Screen>
    );
  }
  const trip = query.data.trips.active[0];

  const tripEvent = async (
    eventType: "trip_started" | "trip_paused" | "trip_ended"
  ) => {
    if (!trip) return;
    setPending(true);
    try {
      await sendOrQueueMobileEvent({
        path: `/api/trips/${trip.id}/events`,
        method: "POST",
        body: { eventType },
      });
      if (eventType === "trip_started") {
        await startDriverTracking(trip.id);
        setTrackingTripId(trip.id);
      }
      if (eventType === "trip_ended") {
        await stopDriverTracking();
        setTrackingTripId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
    } catch (error) {
      Alert.alert(
        "Trip update failed",
        error instanceof Error ? error.message : "Try again."
      );
    } finally {
      setPending(false);
    }
  };

  const childEvent = async (
    assignmentId: string,
    action: "on_the_way" | "picked_up" | "dropped_off"
  ) => {
    setPending(true);
    try {
      let coords: Location.LocationObjectCoords | null = null;
      if (action === "dropped_off") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          throw new Error("Location permission is required for verified drop-off.");
        }
        coords = (await Location.getCurrentPositionAsync()).coords;
      }
      await sendOrQueueMobileEvent({
        id: Crypto.randomUUID(),
        path: `/api/child-driver-assignments/${assignmentId}/status`,
        method: "PATCH",
        body: {
          action,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          accuracy: coords?.accuracy,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
    } catch (error) {
      Alert.alert(
        "Status update failed",
        error instanceof Error ? error.message : "Try again."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <Header
        eyebrow="Driver operations"
        title={`Hello, ${query.data.profile.name.split(" ")[0]}`}
        subtitle="Location sharing runs only while an active trip is being tracked."
      />
      <Card>
        <View style={styles.row}>
          <Text style={textStyles.cardTitle}>
            {query.data.driver?.bus?.bus_product_name || "Assigned vehicle"}
          </Text>
          <StatusPill
            label={query.data.driver?.verificationStatus || "UNSUBMITTED"}
          />
        </View>
        <Text style={textStyles.muted}>
          {query.data.driver?.bus?.bus_number ||
            query.data.driver?.plateNumber ||
            "Vehicle details pending"}
        </Text>
      </Card>
      {trip ? (
        <Card>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>{trip.title}</Text>
            <StatusPill
              label={trip.status}
              danger={trip.status === "emergency"}
            />
          </View>
          <Text style={textStyles.muted}>
            {trackingTripId === trip.id
              ? "Background location is sharing"
              : "Background location is stopped"}
          </Text>
          <View style={styles.actions}>
            {trip.status === "scheduled" ? (
              <AppButton
                label="Start trip and location"
                disabled={pending}
                onPress={() => void tripEvent("trip_started")}
              />
            ) : null}
            {trip.status === "active" ? (
              <AppButton
                variant="outline"
                label="Pause trip"
                disabled={pending}
                onPress={() => void tripEvent("trip_paused")}
              />
            ) : null}
            {trip.status === "paused" ? (
              <AppButton
                label="Resume trip"
                disabled={pending}
                onPress={() => void tripEvent("trip_started")}
              />
            ) : null}
            {["active", "paused"].includes(trip.status) ? (
              <AppButton
                variant="success"
                label="Complete trip"
                disabled={pending}
                onPress={() =>
                  Alert.alert("Complete trip?", "Location sharing will stop.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Complete",
                      onPress: () => void tripEvent("trip_ended"),
                    },
                  ])
                }
              />
            ) : null}
          </View>
        </Card>
      ) : (
        <EmptyState
          title="No assigned trip"
          message="A school operator or family must assign a trip before tracking begins."
        />
      )}
      <Text style={textStyles.cardTitle}>Children</Text>
      <View style={styles.list}>
        {query.data.assignments.map((assignment) => (
          <Card key={assignment.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>
                  {assignment.child.fullName}
                </Text>
                <Text style={textStyles.muted}>
                  {assignment.child.address || "Address not set"}
                </Text>
              </View>
              <StatusPill label={assignment.lastStatus || assignment.status} />
            </View>
            <View style={styles.actions}>
              <AppButton
                variant="outline"
                label="On the way"
                disabled={pending}
                onPress={() => void childEvent(assignment.id, "on_the_way")}
              />
              <AppButton
                label="Picked up"
                disabled={pending}
                onPress={() => void childEvent(assignment.id, "picked_up")}
              />
              <AppButton
                variant="success"
                label="Dropped off"
                disabled={pending}
                onPress={() => void childEvent(assignment.id, "dropped_off")}
              />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
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
  actions: { gap: 8 },
});
