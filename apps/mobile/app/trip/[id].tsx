import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/context";
import { TripMap } from "../../src/components/trip-map";
import { TripViewersCard } from "../../src/components/trip-viewers";
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
import { startDriverTracking, stopDriverTracking } from "../../src/services/location";
import { sendOrQueueMobileEvent } from "../../src/services/offline-queue";
import { subscribeToTrip } from "../../src/services/realtime";
import type { MobileTrip } from "../../src/types";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const query = useQuery({
    queryKey: ["mobile-trip", id],
    queryFn: () =>
      apiRequest<{ trip: MobileTrip }>(`/api/mobile/trips/${id}`),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!id) return;
    let unsubscribe: () => void = () => {};
    void subscribeToTrip(id, () => {
      void queryClient.invalidateQueries({ queryKey: ["mobile-trip", id] });
      void queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] });
    }).then((next) => {
      unsubscribe = next;
    });
    return () => unsubscribe();
  }, [id, queryClient]);

  if (query.isLoading) return <LoadingState label="Loading trip safety…" />;
  if (!query.data?.trip) {
    return (
      <Screen>
        <EmptyState
          title="Trip unavailable"
          message="It may be outside your visible history or your access was revoked."
        />
      </Screen>
    );
  }
  const trip = query.data.trip;

  const sendTripEvent = async (
    eventType: "trip_started" | "trip_paused" | "trip_ended"
  ) => {
    setPending(true);
    try {
      await sendOrQueueMobileEvent({
        path: `/api/trips/${trip.id}/events`,
        method: "POST",
        body: { eventType },
      });
      if (actor?.role === "driver" && eventType === "trip_started") {
        await startDriverTracking(trip.id);
      }
      if (actor?.role === "driver" && eventType === "trip_ended") {
        await stopDriverTracking();
      }
      await query.refetch();
    } catch (error) {
      Alert.alert(
        "Trip update failed",
        error instanceof Error ? error.message : "Try again."
      );
    } finally {
      setPending(false);
    }
  };

  const emergency = async (resolve = false) => {
    setPending(true);
    try {
      await sendOrQueueMobileEvent({
        path: `/api/trips/${trip.id}/emergency`,
        method: "POST",
        body: { resolve },
      });
      await query.refetch();
    } catch (error) {
      Alert.alert(
        "Emergency update failed",
        error instanceof Error ? error.message : "Call local emergency services."
      );
    } finally {
      setPending(false);
    }
  };

  const operator = actor && ["driver", "teacher"].includes(actor.role);
  // Viewer invites and CSV reports belong to the family trip's owner (parent, not a school trip).
  const ownsTrip = actor?.role === "parent" && trip.createdBy === actor.id && !trip.schoolId;
  return (
    <Screen>
      <Header
        eyebrow={trip.tripType.replaceAll("_", " ")}
        title={trip.title}
        subtitle="Live safety information for authorized participants."
      />
      <View style={styles.row}>
        <StatusPill
          label={trip.status}
          danger={trip.status === "emergency"}
        />
        <StatusPill
          label={trip.safetyState}
          danger={trip.safetyState === "emergency"}
        />
      </View>
      <TripMap location={trip.locations[0]} />
      <Card>
        <Text style={textStyles.cardTitle}>Emergency</Text>
        <Text style={textStyles.muted}>
          This safety control is available on every PocketShuttle plan.
        </Text>
        {trip.status === "emergency" && operator ? (
          <AppButton
            variant="success"
            label="Resolve emergency"
            disabled={pending}
            onPress={() =>
              Alert.alert(
                "Resolve emergency?",
                "Only resolve when the situation is safe.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Resolve", onPress: () => void emergency(true) },
                ]
              )
            }
          />
        ) : trip.status !== "emergency" ? (
          <AppButton
            variant="danger"
            label="Trigger emergency alert"
            disabled={pending}
            onPress={() =>
              Alert.alert(
                "Trigger emergency alert?",
                "Authorized families and school staff will be notified.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Trigger alert",
                    style: "destructive",
                    onPress: () => void emergency(false),
                  },
                ]
              )
            }
          />
        ) : null}
      </Card>
      {operator ? (
        <Card>
          <Text style={textStyles.cardTitle}>Trip controls</Text>
          {["scheduled", "paused"].includes(trip.status) ? (
            <AppButton
              label={trip.status === "paused" ? "Resume trip" : "Start trip"}
              disabled={pending}
              onPress={() => void sendTripEvent("trip_started")}
            />
          ) : null}
          {trip.status === "active" ? (
            <AppButton
              variant="outline"
              label="Pause trip"
              disabled={pending}
              onPress={() => void sendTripEvent("trip_paused")}
            />
          ) : null}
          {["active", "paused"].includes(trip.status) ? (
            <AppButton
              variant="success"
              label="Complete trip"
              disabled={pending}
              onPress={() => void sendTripEvent("trip_ended")}
            />
          ) : null}
        </Card>
      ) : null}
      {ownsTrip ? <TripViewersCard tripId={trip.id} tripTitle={trip.title} /> : null}
      <Text style={textStyles.cardTitle}>Timeline</Text>
      <View style={styles.timeline}>
        {trip.events.map((event) => (
          <Card key={event.id}>
            <View style={styles.row}>
              <Text style={textStyles.body}>
                {event.eventType.replaceAll("_", " ")}
              </Text>
              <Text style={textStyles.muted}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </Card>
        ))}
        {!trip.events.length ? (
          <EmptyState
            title="No timeline events"
            message="Operational and safety events will appear here."
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  timeline: { gap: 10 },
});
