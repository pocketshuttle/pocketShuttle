import { useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { LocationMap } from "../../../src/components/trip-map";
import {
  AppButton,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  textStyles,
} from "../../../src/components/ui";
import { useConnections } from "../../../src/hooks/marketplace";
import { mapsUrl, timeAgo } from "../../../src/lib/child-place-label";

export default function DriverMapScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const connections = useConnections("parent");
  const connection = connections.data?.find((item) => item.driver.id === driverId);

  if (connections.isLoading) return <LoadingState label="Loading location…" />;
  const live = connection?.driver.liveAddress;
  const hasLive = typeof live?.latitude === "number" && typeof live?.longitude === "number";

  return (
    <Screen>
      <Header
        eyebrow="Live location"
        title={connection?.driver.full_name ?? "Driver"}
        subtitle={connection ? `Driver active ${timeAgo(connection.driver.lastActiveAt)} · refreshes every 15 s` : undefined}
      />
      {connection && hasLive ? (
        <>
          <LocationMap
            latitude={live!.latitude!}
            longitude={live!.longitude!}
            title={connection.driver.full_name}
            description={`Active ${timeAgo(connection.driver.lastActiveAt)}`}
            height={380}
          />
          <Card>
            <View style={styles.row}>
              <Text style={textStyles.muted}>
                {live!.latitude!.toFixed(5)}, {live!.longitude!.toFixed(5)}
              </Text>
            </View>
            <AppButton
              label="Open in Google Maps"
              variant="outline"
              onPress={() => Linking.openURL(mapsUrl(live!.latitude!, live!.longitude!))}
            />
          </Card>
        </>
      ) : (
        <EmptyState
          title="No location shared yet"
          message="Ask the driver to share their location, or wait for the next update."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
