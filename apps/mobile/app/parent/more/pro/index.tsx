import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, Header, ListRow, LoadingState, Screen, SectionTitle, StatusPill, textStyles } from "../../../../src/components/ui";
import { UpgradePrompt } from "../../../../src/components/upgrade-prompt";
import { isEntitled, useParentPro, useRecurringSuggestions } from "../../../../src/hooks/billing";
import { humanizeKey, humanizeStatus } from "../../../../src/lib/child-place-label";
import { colors, spacing } from "../../../../src/theme";

export default function ProHubScreen() {
  const router = useRouter();
  const pro = useParentPro();
  const suggestions = useRecurringSuggestions();

  if (pro.isLoading) return <LoadingState label="Loading Pro Family…" />;
  const data = pro.data;
  const entitlements = data?.plan.entitlements;
  const entitled = (key: string) => isEntitled(entitlements, key);
  const isPro = data ? entitled("geofences") || entitled("recurring_trips") : false;
  const base = "/parent/more/pro";
  const pendingSuggestions = suggestions.data?.length ?? 0;
  const activePlaces = data?.places.filter((place) => place.isActive).length ?? 0;
  const activeTemplates = data?.templates.filter((template) => template.isActive).length ?? 0;
  const enabledChannels = data?.preferences.filter((pref) => pref.enabled && pref.channel !== "PUSH").map((pref) => pref.channel) ?? [];

  return (
    <Screen>
      <Header
        eyebrow="Pro Family"
        title="Safety automation"
        subtitle={data ? `${data.plan.name} · ${humanizeStatus(data.plan.status)}` : undefined}
        right={data ? <StatusPill label={isPro ? "Pro" : "Free"} tone={isPro ? "success" : "neutral"} /> : undefined}
      />

      {!isPro ? (
        <UpgradePrompt
          feature="recurring_trips"
          requiredPlan="PRO_FAMILY"
          message="Pro Family unlocks saved places with geofences, recurring trips, extra trip viewers, downloadable reports and SMS/WhatsApp alerts."
        />
      ) : null}

      {data?.usage ? (
        <View style={styles.grid}>
          {Object.entries(data.usage).map(([key, value]) => (
            <View key={key} style={styles.stat}>
              <Text style={styles.statValue}>
                {value.current}
                <Text style={styles.statLimit}>/{value.limit ?? "∞"}</Text>
              </Text>
              <Text style={styles.statLabel}>{humanizeKey(key)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionTitle>Automation</SectionTitle>
      <Card>
        <ListRow
          icon="sparkles-outline"
          title="Recurring trip suggestions"
          subtitle={pendingSuggestions ? `${pendingSuggestions} waiting for you` : "We spot trips you repeat and suggest a schedule"}
          right={pendingSuggestions ? <StatusPill label={String(pendingSuggestions)} tone="warning" /> : undefined}
          onPress={() => router.push(`${base}/suggestions`)}
        />
        <ListRow
          icon="location-outline"
          title="Saved places & geofences"
          subtitle={activePlaces ? `${activePlaces} active` : "Home, school, grandma's house"}
          right={!entitled("geofences") ? <StatusPill label="Pro" /> : undefined}
          onPress={() => router.push(`${base}/places`)}
        />
        <ListRow
          icon="repeat-outline"
          title="Recurring trips"
          subtitle={activeTemplates ? `${activeTemplates} scheduled` : "Daily or weekly trips on autopilot"}
          right={!entitled("recurring_trips") ? <StatusPill label="Pro" /> : undefined}
          onPress={() => router.push(`${base}/templates`)}
        />
      </Card>

      <SectionTitle>Sharing & alerts</SectionTitle>
      <Card>
        <ListRow
          icon="people-outline"
          title="Trip viewers & reports"
          subtitle="Invite family to follow a trip and download CSV reports from any trip"
          right={!entitled("multiple_viewers") ? <StatusPill label="Pro" /> : undefined}
          onPress={() => router.push("/parent/trips")}
        />
        <ListRow
          icon="chatbubbles-outline"
          title="SMS & WhatsApp alerts"
          subtitle={enabledChannels.length ? `${enabledChannels.map((c) => (c === "WHATSAPP" ? "WhatsApp" : c)).join(" and ")} on` : "Pickup and drop-off alerts beyond push"}
          right={!entitled("premium_notifications") ? <StatusPill label="Pro" /> : undefined}
          onPress={() => router.push(`${base}/notifications`)}
        />
      </Card>

      {data?.deliveries.length ? (
        <>
          <SectionTitle>Recent deliveries</SectionTitle>
          <Card>
            {data.deliveries.slice(0, 5).map((delivery) => (
              <View key={delivery.id} style={styles.delivery}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.body}>{delivery.eventType ? humanizeStatus(delivery.eventType) : "Notification"}</Text>
                  <Text style={textStyles.muted}>
                    {delivery.channel} · {new Date(delivery.createdAt).toLocaleString()}
                  </Text>
                </View>
                <StatusPill label={humanizeStatus(delivery.status)} tone={delivery.status === "FAILED" ? "danger" : "neutral"} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLimit: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  delivery: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6 },
});
