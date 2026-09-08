import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, Text, View } from "react-native";

import { API_URL } from "../api/client";
import { useAuth } from "../auth/context";
import { useToast } from "../components/toast";
import { Card, Header, ListRow, Screen, SectionTitle, StatusPill, textStyles } from "../components/ui";
import { useDashboard } from "../hooks/use-dashboard";
import { confirm } from "../lib/confirm";
import { humanizeStatus } from "../lib/child-place-label";
import { getJson, setJson } from "../services/kv";
import { initializeMobileNotifications, unregisterMobileNotifications } from "../services/notifications";

const PUSH_KEY = "pocketshuttle.mobile.push-enabled";
const WEB = "https://www.pocketshuttle.com";

export function MoreScreen({ role }: { role: "parent" | "driver" }) {
  const router = useRouter();
  const toast = useToast();
  const { actor, signOut } = useAuth();
  const dashboard = useDashboard(role);
  const [push, setPush] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void getJson<boolean>(PUSH_KEY, true).then(setPush);
  }, []);

  const togglePush = async (value: boolean) => {
    if (!actor) return;
    setPushBusy(true);
    try {
      if (value) await initializeMobileNotifications(actor);
      else await unregisterMobileNotifications();
      await setJson(PUSH_KEY, value);
      setPush(value);
      toast.show(value ? "Push notifications on." : "Push notifications off.");
    } catch (error) {
      Alert.alert("Notifications", error instanceof Error ? error.message : "Unable to update notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  const driver = role === "driver" && dashboard.data && "driver" in dashboard.data ? dashboard.data.driver : null;
  const limits = role === "parent" && dashboard.data && "limits" in dashboard.data ? dashboard.data.limits : null;
  const base = `/${role}/more`;

  return (
    <Screen>
      <Header eyebrow="Account" title="More" subtitle={actor ? `${actor.name} · ${actor.email}` : undefined} />

      <SectionTitle>Activity</SectionTitle>
      <Card>
        <ListRow icon="notifications-outline" title="Alerts" subtitle="Driver network and trip updates" onPress={() => router.push(`${base}/notifications`)} />
        {role === "driver" ? (
          <>
            <ListRow
              icon="shield-checkmark-outline"
              title="Verification"
              subtitle={driver ? humanizeStatus(driver.verificationStatus) : "Documents and identity"}
              right={driver ? <StatusPill label={humanizeStatus(driver.verificationStatus)} danger={driver.verificationStatus === "REJECTED"} /> : undefined}
              onPress={() => router.push(`${base}/verify`)}
            />
            <ListRow icon="car-outline" title="Vehicle" subtitle={[driver?.carMake, driver?.carModel, driver?.plateNumber].filter(Boolean).join(" · ") || "Vehicle details"} onPress={() => router.push(`${base}/vehicle`)} />
          </>
        ) : (
          <>
            <ListRow
              icon="sparkles-outline"
              title="Pro Family"
              subtitle="Saved places, recurring trips, viewers, SMS & WhatsApp alerts"
              onPress={() => router.push(`${base}/pro`)}
            />
            <ListRow
              icon="card-outline"
              title="Plan & billing"
              subtitle={limits ? `${limits.planName} · ${limits.childCount}/${limits.maxChildren ?? "∞"} kids · ${limits.driverCount}/${limits.maxConnectedDrivers ?? "∞"} drivers` : "Your subscription"}
              onPress={() => router.push(`${base}/plan`)}
            />
          </>
        )}
        <ListRow icon="help-buoy-outline" title="Support" subtitle="Open a ticket or track one" onPress={() => router.push("/support")} />
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card>
        <ListRow icon="person-outline" title="Profile" subtitle="This device and session" onPress={() => router.push(`${base}/profile`)} />
        <ListRow icon="key-outline" title="Change password" onPress={() => router.push("/account/change-password")} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={textStyles.body}>Push notifications</Text>
            <Text style={textStyles.muted}>Pickup, drop-off and safety alerts on this device.</Text>
          </View>
          <Switch value={push} disabled={pushBusy} onValueChange={(value) => void togglePush(value)} />
        </View>
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card>
        <ListRow icon="information-circle-outline" title="FAQ" onPress={() => Linking.openURL(`${WEB}/faq`)} />
        <ListRow icon="lock-closed-outline" title="Privacy" onPress={() => Linking.openURL(`${WEB}/privacy`)} />
        <ListRow icon="document-text-outline" title="Terms of service" onPress={() => Linking.openURL(`${WEB}/terms`)} />
        <ListRow icon="globe-outline" title="Open the web dashboard" subtitle={API_URL.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(API_URL)} />
      </Card>

      <Card>
        <ListRow
          icon="log-out-outline"
          title="Sign out"
          destructive
          onPress={async () => {
            if (await confirm({ title: "Sign out?", message: "Background tracking will stop immediately.", confirmLabel: "Sign out", destructive: true })) {
              await signOut();
            }
          }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8 },
});
