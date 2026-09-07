import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AssignmentStatusControls } from "../../src/components/assignment-status-controls";
import { useToast } from "../../src/components/toast";
import {
  AppButton,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "../../src/components/ui";
import { useDashboard } from "../../src/hooks/use-dashboard";
import { childPlaceLabel, humanizeStatus, timeAgo } from "../../src/lib/child-place-label";
import {
  activeTrackingTripId,
  isForegroundSharing,
  shareLocationOnce,
  startDriverTracking,
  startForegroundSharing,
  stopDriverTracking,
  stopForegroundSharing,
} from "../../src/services/location";
import { sendOrQueueMobileEvent } from "../../src/services/offline-queue";

export default function DriverHome() {
  const router = useRouter();
  const query = useDashboard("driver");
  const queryClient = useQueryClient();
  const toast = useToast();
  const [trackingTripId, setTrackingTripId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sharingNow, setSharingNow] = useState(false);
  const [continuous, setContinuous] = useState(isForegroundSharing());
  const [lastSharedAt, setLastSharedAt] = useState<string | null>(null);

  useEffect(() => {
    void activeTrackingTripId().then(setTrackingTripId);
  }, []);

  if (query.isLoading) return <LoadingState label="Loading your dashboard…" />;
  if (!query.data) {
    return (
      <Screen>
        <Header title="Driver" />
        <EmptyState title="Unable to load" message="Check your connection." />
      </Screen>
    );
  }
  const { driver, assignments, trips, connectionCounts, profile } = query.data;
  const trip = trips.active[0];

  const tripEvent = async (eventType: "trip_started" | "trip_paused" | "trip_ended") => {
    if (!trip) return;
    setPending(true);
    try {
      await sendOrQueueMobileEvent({
        path: `/api/trips/${trip.id}/events`,
        method: "POST",
        body: { eventType },
      });
      if (eventType === "trip_started") {
        stopForegroundSharing();
        setContinuous(false);
        await startDriverTracking(trip.id);
        setTrackingTripId(trip.id);
      }
      if (eventType === "trip_ended") {
        await stopDriverTracking();
        setTrackingTripId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
    } catch (error) {
      Alert.alert("Trip update failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setPending(false);
    }
  };

  const shareNow = async () => {
    setSharingNow(true);
    try {
      await shareLocationOnce();
      setLastSharedAt(new Date().toISOString());
      toast.show("Location shared with your approved families.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
    } catch (error) {
      Alert.alert("Unable to share location", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSharingNow(false);
    }
  };

  const toggleContinuous = async (value: boolean) => {
    try {
      if (value) {
        await startForegroundSharing();
        toast.show("Live sharing on while the app is open.");
      } else {
        stopForegroundSharing();
      }
      setContinuous(value && isForegroundSharing());
    } catch (error) {
      setContinuous(false);
      Alert.alert("Unable to start sharing", error instanceof Error ? error.message : "Try again.");
    }
  };

  const copy = async (label: string, value?: string | null) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    toast.show(`${label} copied.`, { variant: "success" });
  };

  const verification = driver?.verificationStatus || "UNSUBMITTED";

  return (
    <Screen>
      <Header
        eyebrow="Driver operations"
        title={`Hello, ${profile.name.split(" ")[0]}`}
        subtitle="Manage your families, share your location and update trip status."
      />

      {verification !== "VERIFIED" ? (
        <Card style={styles.warnCard}>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>Verification</Text>
            <StatusPill label={humanizeStatus(verification)} danger={verification === "REJECTED"} />
          </View>
          <Text style={textStyles.body}>
            {verification === "PENDING_REVIEW"
              ? "Your documents are being reviewed. Families can still connect with you."
              : verification === "REJECTED"
                ? driver?.verificationRejectionReason || "Your verification was rejected. Please resubmit."
                : "Complete verification so parents can trust your profile."}
          </Text>
          <AppButton label={verification === "REJECTED" ? "Fix and resubmit" : "Complete verification"} onPress={() => router.push("/driver/more/verify")} />
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <Pressable style={styles.stat} onPress={() => router.push("/driver/families")}>
          <Text style={styles.statValue}>{connectionCounts.approved}</Text>
          <Text style={textStyles.muted}>Approved families</Text>
        </Pressable>
        <Pressable style={styles.stat} onPress={() => router.push("/driver/families")}>
          <Text style={styles.statValue}>{connectionCounts.pending}</Text>
          <Text style={textStyles.muted}>Pending requests</Text>
        </Pressable>
      </View>

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={textStyles.cardTitle}>Share live location</Text>
            <Text style={textStyles.muted}>
              {trackingTripId
                ? "A trip is active — background tracking is sharing automatically."
                : continuous
                  ? "Sharing every 15 s while the app is open."
                  : lastSharedAt
                    ? `Last shared ${timeAgo(lastSharedAt)}.`
                    : "Approved families with assigned kids see your latest position."}
            </Text>
          </View>
          <Switch
            value={!!trackingTripId || continuous}
            disabled={!!trackingTripId}
            onValueChange={(value) => void toggleContinuous(value)}
          />
        </View>
        <AppButton
          label={sharingNow ? "Sharing…" : "Share location now"}
          disabled={sharingNow}
          onPress={() => void shareNow()}
        />
      </Card>

      <Card>
        <Text style={textStyles.cardTitle}>Your share ID</Text>
        <Text style={textStyles.muted}>Parents use this to find and request you.</Text>
        <View style={styles.row}>
          <Text style={styles.shareId}>{driver?.shareId || "Generating…"}</Text>
          <AppButton label="Copy" variant="outline" onPress={() => void copy("Share ID", driver?.shareId)} />
        </View>
        <Text style={textStyles.muted}>
          {[driver?.carColor, driver?.carMake, driver?.carModel].filter(Boolean).join(" ") || "Vehicle details pending"}
          {driver?.plateNumber ? ` · ${driver.plateNumber}` : ""}
        </Text>
      </Card>

      {trip ? (
        <Card>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>{trip.title}</Text>
            <StatusPill label={trip.status} danger={trip.status === "emergency"} />
          </View>
          <Text style={textStyles.muted}>
            {trackingTripId === trip.id ? "Background location is sharing" : "Background location is stopped"}
          </Text>
          <View style={styles.actions}>
            {trip.status === "scheduled" ? (
              <AppButton label="Start trip and location" disabled={pending} onPress={() => void tripEvent("trip_started")} />
            ) : null}
            {trip.status === "active" ? (
              <AppButton variant="outline" label="Pause trip" disabled={pending} onPress={() => void tripEvent("trip_paused")} />
            ) : null}
            {trip.status === "paused" ? (
              <AppButton label="Resume trip" disabled={pending} onPress={() => void tripEvent("trip_started")} />
            ) : null}
            {["active", "paused"].includes(trip.status) ? (
              <AppButton
                variant="success"
                label="Complete trip"
                disabled={pending}
                onPress={() =>
                  Alert.alert("Complete trip?", "Location sharing will stop.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Complete", onPress: () => void tripEvent("trip_ended") },
                  ])
                }
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      <SectionTitle>Assigned kids</SectionTitle>
      <View style={styles.list}>
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>{assignment.child.fullName}</Text>
                <Text style={textStyles.muted}>
                  Parent: {assignment.parent.full_name || "Parent"} · {assignment.child.address || "No school address"}
                </Text>
              </View>
              <StatusPill label={childPlaceLabel(assignment)} />
            </View>
            <Text style={textStyles.muted}>Last status {timeAgo(assignment.lastStatusAt)}</Text>
            <AssignmentStatusControls assignmentId={assignment.id} lastStatus={assignment.lastStatus} />
          </Card>
        ))}
        {!assignments.length ? (
          <EmptyState
            title="No children assigned yet"
            message="Child details appear here after a parent approves you and assigns their kids."
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  actions: { gap: 8 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 2,
  },
  statValue: { color: "#0F172A", fontSize: 26, fontWeight: "800" },
  shareId: { color: "#312E81", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  warnCard: { borderColor: "#FDE68A", backgroundColor: "#FFFBEB" },
});
