import { useRouter } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../src/api/client";
import { TripMap } from "../../src/components/trip-map";
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
import { UpgradePrompt } from "../../src/components/upgrade-prompt";
import { queryKeys } from "../../src/hooks/marketplace";
import { useApiMutation } from "../../src/hooks/use-api-mutation";
import { useDashboard } from "../../src/hooks/use-dashboard";
import { childPlaceLabel, timeAgo } from "../../src/lib/child-place-label";

export default function ParentHome() {
  const router = useRouter();
  const query = useDashboard("parent");
  const requestLocation = useApiMutation(
    (assignmentId: string) =>
      apiRequest<{ message: string }>(
        `/api/child-driver-assignments/${assignmentId}/location-request`,
        { method: "POST" }
      ),
    {
      invalidate: [queryKeys.knownDriverEvents],
      successMessage: "Location request sent to the driver.",
    }
  );

  if (query.isLoading) return <LoadingState label="Loading your family…" />;
  if (!query.data) {
    return (
      <Screen>
        <Header title="Family" />
        <EmptyState title="Unable to load" message="Check your connection and try again." />
      </Screen>
    );
  }

  const { limits, assignments, trips, profile } = query.data;
  const activeTrip = trips.active[0];
  const childLimitReached =
    limits.enforcementEnabled && limits.maxChildren !== null && limits.childCount >= limits.maxChildren;
  const driverLimitReached =
    limits.enforcementEnabled &&
    limits.maxConnectedDrivers !== null &&
    limits.driverCount >= limits.maxConnectedDrivers;

  return (
    <Screen>
      <Header
        eyebrow="Family safety"
        title={`Hello, ${profile.name.split(" ")[0]}`}
        subtitle="Follow your children's journeys and manage your trusted drivers."
      />

      <Card>
        <View style={styles.row}>
          <Text style={textStyles.cardTitle}>Your plan</Text>
          <StatusPill label={limits.planName} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {limits.childCount}/{limits.maxChildren ?? "∞"}
            </Text>
            <Text style={textStyles.muted}>Children</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {limits.driverCount}/{limits.maxConnectedDrivers ?? "∞"}
            </Text>
            <Text style={textStyles.muted}>Drivers</Text>
          </View>
        </View>
        {childLimitReached || driverLimitReached ? (
          <UpgradePrompt
            compact
            feature={childLimitReached ? "max_children" : "max_connected_drivers"}
            requiredPlan="PRO_FAMILY"
          />
        ) : null}
      </Card>

      {activeTrip ? (
        <>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>{activeTrip.title}</Text>
            <StatusPill label={activeTrip.status} danger={activeTrip.status === "emergency"} />
          </View>
          <TripMap location={activeTrip.locations[0]} />
        </>
      ) : null}

      <SectionTitle>Your drivers</SectionTitle>
      <View style={styles.list}>
        {assignments.map((assignment) => {
          const live = assignment.driver.liveAddress;
          const hasLive =
            typeof live?.latitude === "number" && typeof live?.longitude === "number";
          return (
            <Card key={assignment.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.cardTitle}>{assignment.driver.full_name}</Text>
                  <Text style={textStyles.muted}>
                    {assignment.child.fullName}
                    {assignment.driver.plateNumber ? ` · ${assignment.driver.plateNumber}` : ""}
                  </Text>
                </View>
                <StatusPill label={childPlaceLabel(assignment)} />
              </View>
              <Text style={textStyles.muted}>
                Last update {timeAgo(assignment.lastStatusAt)} · Driver active{" "}
                {timeAgo(assignment.driver.lastActiveAt)}
              </Text>
              <View style={styles.actions}>
                <AppButton
                  label={hasLive ? "View on map" : "No location yet"}
                  variant="outline"
                  disabled={!hasLive}
                  onPress={() =>
                    router.push({
                      pathname: "/parent/drivers/map",
                      params: { driverId: assignment.driver.id },
                    })
                  }
                />
                <AppButton
                  label={requestLocation.isPending ? "Requesting…" : "Request location"}
                  variant="outline"
                  disabled={requestLocation.isPending}
                  onPress={() => requestLocation.mutate(assignment.id)}
                />
                {assignment.driver.phoneNumber ? (
                  <AppButton
                    label="Call driver"
                    variant="outline"
                    onPress={() => Linking.openURL(`tel:${assignment.driver.phoneNumber}`)}
                  />
                ) : null}
              </View>
            </Card>
          );
        })}
        {!assignments.length ? (
          <Card>
            <Text style={textStyles.cardTitle}>No connected drivers yet</Text>
            <Text style={textStyles.muted}>
              Find a verified driver by share ID, email or phone, then assign your children.
            </Text>
            <AppButton label="Find a driver" onPress={() => router.push("/parent/drivers/add")} />
          </Card>
        ) : null}
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
  statsRow: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F5F7FB",
    padding: 12,
    gap: 2,
  },
  statValue: { color: "#0F172A", fontSize: 22, fontWeight: "800" },
  actions: { gap: 8 },
});
