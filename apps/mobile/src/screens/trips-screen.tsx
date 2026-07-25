import { useDashboard } from "../hooks/use-dashboard";
import type { MobileRole } from "../types";
import { Header, LoadingState, Screen, textStyles } from "../components/ui";
import { TripList } from "../components/trip-list";
import { Text } from "react-native";

export function TripsScreen({ role }: { role: MobileRole }) {
  const query = useDashboard(role);
  if (query.isLoading) return <LoadingState label="Loading trips…" />;
  if (query.error || !query.data) {
    return (
      <Screen>
        <Header title="Trips" />
        <Text style={textStyles.body}>
          We could not load your trips. Pull back and try again.
        </Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <Header
        eyebrow={query.data.trips.plan.name}
        title="Trips"
        subtitle="Active-trip location remains available on every plan."
      />
      <Text style={textStyles.cardTitle}>Active and scheduled</Text>
      <TripList
        trips={query.data.trips.active}
        emptyMessage="No active or scheduled trips are assigned to you."
      />
      <Text style={textStyles.cardTitle}>Recent history</Text>
      <TripList
        trips={query.data.trips.recent}
        emptyMessage="No completed trips are available in your current history window."
      />
    </Screen>
  );
}
