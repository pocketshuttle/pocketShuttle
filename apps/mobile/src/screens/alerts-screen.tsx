import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/context";
import { useToast } from "../components/toast";
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
} from "../components/ui";
import { queryKeys, useKnownDriverEvents } from "../hooks/marketplace";
import { mapsUrl, timeAgo } from "../lib/child-place-label";
import {
  knownDriverEventMessage,
  knownDriverEventTitle,
  lastSeenKey,
} from "../lib/known-driver-events";
import { getJson, setJson } from "../services/kv";
import { shareLocationOnce } from "../services/location";

type TripNotification = {
  id: string;
  tripId: string;
  tripTitle: string;
  type: string;
  safetyState: string;
  createdAt: string;
};

export function AlertsScreen({ role }: { role: "parent" | "driver" }) {
  const { actor } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const events = useKnownDriverEvents();
  const tripAlerts = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () =>
      apiRequest<{ notifications: TripNotification[] }>("/api/mobile/notifications"),
    refetchInterval: 20_000,
  });
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const stamped = useRef(false);

  useEffect(() => {
    if (!actor) return;
    const key = lastSeenKey(role, actor.id);
    void getJson<string | null>(key, null).then((value) => {
      setLastSeen(value);
      if (!stamped.current) {
        stamped.current = true;
        void setJson(key, new Date().toISOString());
      }
    });
  }, [actor, role]);

  const shareLocation = async () => {
    setSharing(true);
    try {
      await shareLocationOnce();
      toast.show("Location shared.", { variant: "success" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.knownDriverEvents });
    } catch (error) {
      Alert.alert("Unable to share location", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSharing(false);
    }
  };

  if (events.isLoading && tripAlerts.isLoading) return <LoadingState label="Loading alerts…" />;

  const list = events.data ?? [];
  const isNew = (createdAt: string) => !lastSeen || new Date(createdAt) > new Date(lastSeen);

  return (
    <Screen>
      <Header
        title="Alerts"
        subtitle="Driver network updates and trip safety alerts. Critical alerts are available on every plan."
      />

      <SectionTitle>Driver network</SectionTitle>
      {list.length ? (
        <View style={styles.list}>
          {list.map((event) => {
            const hasCoords =
              typeof event.latitude === "number" && typeof event.longitude === "number";
            return (
              <Card key={event.id}>
                <View style={styles.row}>
                  <Text style={textStyles.cardTitle}>{knownDriverEventTitle(event.eventType)}</Text>
                  <View style={styles.pills}>
                    {isNew(event.createdAt) ? <StatusPill label="New" /> : null}
                    {event.eventType === "ALERT_SENT" ? <StatusPill label="Alert" danger /> : null}
                  </View>
                </View>
                <Text style={textStyles.body}>{knownDriverEventMessage(event, role)}</Text>
                <Text style={textStyles.muted}>{timeAgo(event.createdAt)}</Text>
                {role === "driver" && event.eventType === "LOCATION_REQUESTED" ? (
                  <AppButton
                    label={sharing ? "Sharing…" : "Share location"}
                    disabled={sharing}
                    onPress={() => void shareLocation()}
                  />
                ) : null}
                {role === "parent" && hasCoords ? (
                  <AppButton
                    label="View on map"
                    variant="outline"
                    onPress={() => Linking.openURL(mapsUrl(event.latitude!, event.longitude!))}
                  />
                ) : null}
              </Card>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="No driver updates yet"
          message={
            role === "parent"
              ? "Pickups, drop-offs and location updates from your drivers appear here."
              : "Location requests and your status updates appear here."
          }
        />
      )}

      <SectionTitle>Trip alerts</SectionTitle>
      {tripAlerts.data?.notifications.length ? (
        <View style={styles.list}>
          {tripAlerts.data.notifications.slice(0, 30).map((item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <Text style={textStyles.cardTitle}>{item.tripTitle}</Text>
                <StatusPill
                  label={item.type}
                  danger={item.type.includes("emergency") || item.safetyState === "emergency"}
                />
              </View>
              <Text style={textStyles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
            </Card>
          ))}
        </View>
      ) : (
        <Text style={textStyles.muted}>No trip alerts yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  pills: { flexDirection: "row", gap: 6 },
});
