import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { TripMap } from "../../src/components/trip-map";
import {
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  StatusPill,
  textStyles,
} from "../../src/components/ui";
import { useDashboard } from "../../src/hooks/use-dashboard";

export default function ParentHome() {
  const query = useDashboard("parent");
  if (query.isLoading) return <LoadingState label="Loading your family…" />;
  if (!query.data) {
    return (
      <Screen>
        <Header title="Family" />
        <EmptyState
          title="Unable to load"
          message="Check your connection and try again."
        />
      </Screen>
    );
  }
  const activeTrip = query.data.trips.active[0];
  return (
    <Screen>
      <Header
        eyebrow="Family safety"
        title={`Hello, ${query.data.profile.name.split(" ")[0]}`}
        subtitle="Follow active journeys and receive critical updates."
      />
      {activeTrip ? (
        <>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>{activeTrip.title}</Text>
            <StatusPill
              label={activeTrip.status}
              danger={activeTrip.status === "emergency"}
            />
          </View>
          <TripMap location={activeTrip.locations[0]} />
        </>
      ) : (
        <EmptyState
          title="No active trip"
          message="Your map will appear when an authorized driver starts a journey."
        />
      )}
      <Text style={textStyles.cardTitle}>Children</Text>
      <View style={styles.list}>
        {query.data.children.map((child) => (
          <Card key={`${child.source}:${child.id}`}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>{child.name || "Child"}</Text>
                <Text style={textStyles.muted}>
                  {child.grade || "Grade not set"} · {child.source}
                </Text>
              </View>
              {child.status ? <StatusPill label={child.status} /> : null}
            </View>
          </Card>
        ))}
      </View>
      <Text style={textStyles.cardTitle}>Connected drivers</Text>
      <View style={styles.list}>
        {query.data.assignments.map((assignment) => (
          <Card key={assignment.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>
                  {assignment.driver.full_name}
                </Text>
                <Text style={textStyles.muted}>
                  {assignment.child.fullName}
                  {assignment.driver.plateNumber
                    ? ` · ${assignment.driver.plateNumber}`
                    : ""}
                </Text>
              </View>
              <StatusPill label={assignment.lastStatus || assignment.status} />
            </View>
          </Card>
        ))}
        {!query.data.assignments.length ? (
          <EmptyState
            title="No connected drivers"
            message="Connect a driver from the PocketShuttle web dashboard."
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
});
