import { useRouter } from "expo-router";
import { Text } from "react-native";

import { AppButton, Card, Header, ListRow, LoadingState, Screen, textStyles } from "../../../src/components/ui";
import { useDashboard } from "../../../src/hooks/use-dashboard";

export default function VehicleScreen() {
  const router = useRouter();
  const dashboard = useDashboard("driver");
  if (dashboard.isLoading) return <LoadingState label="Loading vehicle…" />;
  const driver = dashboard.data?.driver;
  const vehicle = [driver?.carColor, driver?.carMake, driver?.carModel].filter(Boolean).join(" ");

  return (
    <Screen>
      <Header eyebrow="Your vehicle" title={vehicle || "Vehicle details"} subtitle={driver?.plateNumber || "Plate number not set"} />
      <Card>
        <ListRow icon="car-outline" title="Make & model" subtitle={vehicle || "Not set"} />
        <ListRow icon="color-palette-outline" title="Colour" subtitle={driver?.carColor || "Not set"} />
        <ListRow icon="pricetag-outline" title="Plate number" subtitle={driver?.plateNumber || "Not set"} />
        <ListRow icon="people-outline" title="Passenger capacity" subtitle={driver?.vehicleCapacity ? `${driver.vehicleCapacity} seats` : "Not set"} />
        <ListRow icon="map-outline" title="Service areas" subtitle={driver?.serviceAreas?.length ? driver.serviceAreas.join(", ") : "Not set"} />
      </Card>
      <Card>
        <Text style={textStyles.cardTitle}>Need to change something?</Text>
        <Text style={textStyles.muted}>
          Vehicle details are locked after registration to keep parents' records accurate. Contact support and we'll update them for you.
        </Text>
        <AppButton label="Contact support" variant="outline" onPress={() => router.push("/support/new")} />
      </Card>
    </Screen>
  );
}
