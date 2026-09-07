import { useRouter } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { API_URL } from "../api/client";
import { useAuth } from "../auth/context";
import { colors } from "../theme";
import { AppButton } from "./ui";

const featureLabels: Record<string, string> = {
  max_children: "adding more children",
  max_connected_drivers: "connecting more drivers",
  max_recurring_trip_templates: "more recurring trips",
  max_viewers: "more trip viewers",
  geofences: "saved places and geofences",
  recurring_trips: "recurring trips",
  multiple_viewers: "additional trip viewers",
  downloadable_reports: "downloadable trip reports",
  premium_notifications: "SMS and WhatsApp alerts",
  priority_support: "priority support",
};

const planLabels: Record<string, string> = {
  PRO_FAMILY: "Pro Family",
  FREE_FAMILY: "Free Family",
};

export function describeFeature(feature?: string | null) {
  if (!feature) return "this feature";
  return featureLabels[feature] ?? feature.replaceAll("_", " ");
}

export function UpgradePrompt({
  feature,
  requiredPlan,
  message,
  onViewPlans,
  compact,
}: {
  feature?: string | null;
  requiredPlan?: string | null;
  message?: string;
  onViewPlans?(): void;
  compact?: boolean;
}) {
  const plan = requiredPlan ? planLabels[requiredPlan] ?? requiredPlan : "a higher plan";
  const body =
    message ?? `Your current plan does not include ${describeFeature(feature)}. Upgrade to ${plan} to unlock it.`;
  const router = useRouter();
  const { actor } = useAuth();
  // Parents pick a plan in-app; other roles (a driver blocked by a parent's plan) get the web page.
  const viewPlans =
    onViewPlans ??
    (actor?.role === "parent"
      ? () => router.push("/parent/more/billing")
      : () => Linking.openURL(`${API_URL}/billing`));
  return (
    <View style={[styles.box, compact && styles.compact]}>
      <Text style={styles.title}>Upgrade required</Text>
      <Text style={styles.body}>{body}</Text>
      <AppButton label="View plans" onPress={viewPlans} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    backgroundColor: "#FFFBEB",
    padding: 14,
  },
  compact: { padding: 12 },
  title: { color: "#92400E", fontSize: 15, fontWeight: "800" },
  body: { color: "#92400E", fontSize: 14, lineHeight: 20 },
});

export { colors as upgradePromptColors };
