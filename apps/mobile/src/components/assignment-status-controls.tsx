import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { ApiError } from "../api/client";
import { queryKeys } from "../hooks/marketplace";
import { tripStages, type TripStageAction } from "../lib/child-place-label";
import { sendOrQueueMobileEvent } from "../services/offline-queue";
import { AppButton } from "./ui";
import { useToast } from "./toast";

type Verification = {
  destinationType?: string;
  distanceMeters?: number;
  radiusMeters?: number;
};

/** OTW / Picked up / Dropped off buttons with GPS-verified drop-off, mirroring the web driver dashboard. */
export function AssignmentStatusControls({
  assignmentId,
  lastStatus,
  compact,
}: {
  assignmentId: string;
  lastStatus?: string | null;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pending, setPending] = useState<TripStageAction | null>(null);

  const update = async (action: TripStageAction) => {
    setPending(action);
    try {
      let coords: Location.LocationObjectCoords | null = null;
      if (action === "dropped_off") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          throw new Error("Location permission is required for a verified drop-off.");
        }
        coords = (
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        ).coords;
      }
      const result = await sendOrQueueMobileEvent<{ message?: string }>(
        {
          id: Crypto.randomUUID(),
          path: `/api/child-driver-assignments/${assignmentId}/status`,
          method: "PATCH",
          body: {
            action,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            accuracy: coords?.accuracy,
          },
        },
        { queueOnlyWhenOffline: true }
      );
      toast.show(
        result.queued ? "You're offline — the update will send when you reconnect." : result.value?.message || "Status updated",
        { variant: result.queued ? "info" : "success" }
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.driverConnections }),
      ]);
    } catch (error) {
      const verification =
        error instanceof ApiError
          ? (error.body?.verification as Verification | undefined)
          : undefined;
      if (verification?.distanceMeters !== undefined) {
        Alert.alert(
          "Too far from the drop-off point",
          `You are ${Math.round(verification.distanceMeters)} m from the saved ${verification.destinationType ?? "drop-off"} location (limit ${verification.radiusMeters ?? 250} m). Move closer and try again.`
        );
      } else {
        Alert.alert(
          "Status update failed",
          error instanceof Error ? error.message : "Try again."
        );
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={compact ? styles.compactRow : styles.actions}>
      {tripStages.map((stage) => {
        const active = lastStatus === stage.eventType;
        return (
          <AppButton
            key={stage.action}
            label={pending === stage.action ? "Sending…" : stage.label}
            variant={active ? "success" : stage.action === "dropped_off" ? "primary" : "outline"}
            disabled={pending !== null}
            onPress={() => void update(stage.action)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  compactRow: { gap: 8 },
});
