import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton, Card, Header, ListRow, LoadingState, Screen, StatusPill, textStyles } from "../../../../src/components/ui";
import { useDashboard } from "../../../../src/hooks/use-dashboard";
import { humanizeStatus } from "../../../../src/lib/child-place-label";
import { useVerificationDraft } from "../../../../src/stores/verification-draft";

const copy: Record<string, { title: string; body: string }> = {
  UNSUBMITTED: { title: "Get verified", body: "Parents see a Verified badge on your profile once our team checks your identity, licence and vehicle documents." },
  PENDING_REVIEW: { title: "Under review", body: "We're checking your documents. You'll be notified when it's done. You can still update a document if something was wrong." },
  VERIFIED: { title: "You're verified", body: "Your documents are approved. Contact support if any of your details change." },
  REJECTED: { title: "Action needed", body: "Some documents were rejected. Fix the items below and resubmit." },
};

export default function VerifyOverview() {
  const router = useRouter();
  const dashboard = useDashboard("driver");
  const { draft, loaded } = useVerificationDraft();
  if (dashboard.isLoading || !loaded) return <LoadingState label="Loading verification…" />;
  const driver = dashboard.data?.driver;
  const status = driver?.verificationStatus || "UNSUBMITTED";
  const text = copy[status] ?? copy.UNSUBMITTED;
  const uploaded = Object.keys(draft.documents).length;
  const canEdit = status !== "VERIFIED";

  return (
    <Screen>
      <Header eyebrow="Driver verification" title={text.title} subtitle={text.body} />
      <Card>
        <View style={styles.row}>
          <Text style={textStyles.cardTitle}>Status</Text>
          <StatusPill label={humanizeStatus(status)} danger={status === "REJECTED"} />
        </View>
        {status === "REJECTED" && driver?.verificationRejectionReason ? (
          <Text style={styles.reason}>{driver.verificationRejectionReason}</Text>
        ) : null}
      </Card>
      <Card>
        <Text style={textStyles.cardTitle}>What you'll need</Text>
        <ListRow icon="person-circle-outline" title="1 · Identity" subtitle="Profile photo, phone, address, landmark, utility bill, passport/NIN" />
        <ListRow icon="card-outline" title="2 · Licence" subtitle="Driving licence (FRSC)" />
        <ListRow icon="car-outline" title="3 · Vehicle" subtitle="Vehicle registration and insurance" />
        <Text style={textStyles.muted}>Photos are uploaded securely and only visible to the PocketShuttle review team.</Text>
      </Card>
      {canEdit ? (
        <AppButton
          label={uploaded > 0 ? "Continue where you left off" : "Start verification"}
          onPress={() => router.push("/driver/more/verify/step-1")}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reason: { color: "#B91C1C", fontSize: 14, lineHeight: 20 },
});
