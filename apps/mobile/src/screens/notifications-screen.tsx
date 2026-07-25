import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../api/client";
import { Card, EmptyState, Header, LoadingState, Screen, StatusPill, textStyles } from "../components/ui";

type NotificationRow = {
  id: string;
  tripId: string;
  tripTitle: string;
  type: string;
  safetyState: string;
  createdAt: string;
};

export function NotificationsScreen() {
  const query = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () =>
      apiRequest<{ notifications: NotificationRow[] }>(
        "/api/mobile/notifications"
      ),
    refetchInterval: 20_000,
  });
  if (query.isLoading) return <LoadingState label="Loading alerts…" />;
  return (
    <Screen>
      <Header
        title="Alerts"
        subtitle="Critical safety updates are available regardless of subscription state."
      />
      {!query.data?.notifications.length ? (
        <EmptyState
          title="No alerts"
          message="Pickup, drop-off, route, and emergency updates will appear here."
        />
      ) : (
        <View style={styles.list}>
          {query.data.notifications.map((item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <Text style={textStyles.cardTitle}>{item.tripTitle}</Text>
                <StatusPill
                  label={item.type}
                  danger={
                    item.type.includes("emergency") ||
                    item.safetyState === "emergency"
                  }
                />
              </View>
              <Text style={textStyles.muted}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
});
