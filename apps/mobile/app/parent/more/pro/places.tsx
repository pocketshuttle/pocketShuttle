import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../../src/api/client";
import { BottomSheet } from "../../../../src/components/bottom-sheet";
import { AppButton, Card, EmptyState, FormField, Header, LoadingState, Screen, StatusPill, textStyles } from "../../../../src/components/ui";
import { UpgradePrompt } from "../../../../src/components/upgrade-prompt";
import { billingKeys, isEntitled, useCustomPlaces, useParentPro } from "../../../../src/hooks/billing";
import { useApiMutation } from "../../../../src/hooks/use-api-mutation";
import { mapsUrl } from "../../../../src/lib/child-place-label";
import { confirm } from "../../../../src/lib/confirm";
import { spacing } from "../../../../src/theme";

const invalidate = [billingKeys.places, billingKeys.pro, ["parent-connections"], ["mobile-dashboard"]];

export default function PlacesScreen() {
  const pro = useParentPro();
  const places = useCustomPlaces();
  const entitled = isEntitled(pro.data?.plan.entitlements, "geofences");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("250");
  const [error, setError] = useState<string | null>(null);

  const create = useApiMutation(
    () =>
      apiRequest<{ message: string }>("/api/custom-places", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), address: address.trim(), radiusMeters: Number(radius) || 250 }),
      }),
    {
      invalidate,
      successMessage: "Saved place created.",
      onSuccess: () => {
        setOpen(false);
        setName("");
        setAddress("");
        setRadius("250");
      },
    }
  );

  const disable = useApiMutation(
    (id: string) => apiRequest<{ message: string }>(`/api/custom-places/${id}`, { method: "DELETE" }),
    { invalidate, successMessage: "Place disabled." }
  );

  const submit = () => {
    const meters = Number(radius);
    if (!name.trim() || !address.trim()) return setError("Add a name and an address.");
    if (!Number.isFinite(meters) || meters < 50 || meters > 5000) return setError("Radius must be between 50 and 5000 metres.");
    setError(null);
    create.mutate(undefined);
  };

  if (pro.isLoading || places.isLoading) return <LoadingState label="Loading saved places…" />;
  const list = places.data ?? [];

  return (
    <Screen>
      <Header
        eyebrow="Pro Family"
        title="Saved places"
        subtitle="Each place has a geofence. Drivers see them, and drop-offs are checked against them."
        right={entitled ? <AppButton label="Add" icon="add" variant="outline" onPress={() => setOpen(true)} /> : undefined}
      />
      {!entitled ? <UpgradePrompt feature="geofences" requiredPlan="PRO_FAMILY" /> : null}
      {create.upgrade ? <UpgradePrompt feature={create.upgrade.feature} requiredPlan={create.upgrade.requiredPlan} /> : null}

      {list.length ? (
        list.map((place) => (
          <Card key={place.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>{place.name}</Text>
                <Text style={textStyles.muted}>
                  {place.radiusMeters} m radius · {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </Text>
              </View>
              <StatusPill label={place.isActive ? "Active" : "Disabled"} tone={place.isActive ? "success" : "neutral"} />
            </View>
            <View style={styles.actions}>
              <AppButton label="View on map" variant="outline" icon="map-outline" onPress={() => Linking.openURL(mapsUrl(place.latitude, place.longitude))} />
              {place.isActive ? (
                <AppButton
                  label={disable.isPending && disable.variables === place.id ? "Disabling…" : "Disable"}
                  variant="ghost"
                  disabled={disable.isPending}
                  onPress={async () => {
                    const ok = await confirm({ title: `Disable ${place.name}?`, message: "Drivers will stop seeing this place and its geofence.", confirmLabel: "Disable", destructive: true });
                    if (ok) disable.mutate(place.id);
                  }}
                />
              ) : null}
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="location-outline"
          title="No saved places yet"
          message="Add home, school or a relative's house so drivers know exactly where to go."
          action={entitled ? <AppButton label="Add a place" onPress={() => setOpen(true)} /> : undefined}
        />
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="New saved place">
        <FormField label="Name" placeholder="e.g. Grandma's house" value={name} onChangeText={setName} autoCapitalize="words" />
        <FormField label="Address" placeholder="Street, area, city" value={address} onChangeText={setAddress} hint="We locate the address for you." />
        <FormField label="Geofence radius (metres)" placeholder="250" value={radius} onChangeText={setRadius} keyboardType="number-pad" error={error} />
        <AppButton label={create.isPending ? "Saving…" : "Save place"} disabled={create.isPending} onPress={submit} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  actions: { gap: spacing.sm },
});
