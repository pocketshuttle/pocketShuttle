import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { formatMoney, useBillingSubscription } from "../../../src/hooks/billing";
import { AppButton, Card, Header, ListRow, LoadingState, Screen, SectionTitle, StatusPill, textStyles } from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { useDashboard } from "../../../src/hooks/use-dashboard";
import { humanizeKey, humanizeStatus } from "../../../src/lib/child-place-label";

export default function PlanScreen() {
  const router = useRouter();
  const dashboard = useDashboard("parent");
  const subscription = useBillingSubscription();
  if (dashboard.isLoading || subscription.isLoading) return <LoadingState label="Loading your plan…" />;
  const limits = dashboard.data?.limits;
  const current = subscription.data?.current;
  const isFree = (current?.planCode ?? limits?.planCode) === "FREE_FAMILY";

  return (
    <Screen>
      <Header eyebrow="Subscription" title={current?.planName ?? limits?.planName ?? "Your plan"} subtitle={current ? `Status: ${humanizeStatus(current.status)}` : undefined} />
      <Card>
        <View style={styles.row}>
          <Text style={textStyles.cardTitle}>Limits on this plan</Text>
          {limits ? <StatusPill label={limits.planName} /> : null}
        </View>
        {limits ? (
          <>
            <ListRow icon="people-outline" title="Children" subtitle={`${limits.childCount} of ${limits.maxChildren ?? "unlimited"}`} />
            <ListRow icon="car-outline" title="Connected drivers" subtitle={`${limits.driverCount} of ${limits.maxConnectedDrivers ?? "unlimited"}`} />
          </>
        ) : null}
        {current?.currentPeriodEnd ? (
          <Text style={textStyles.muted}>Current period ends {new Date(current.currentPeriodEnd).toLocaleDateString()}</Text>
        ) : null}
        {current?.graceEndsAt ? <Text style={textStyles.muted}>Grace period until {new Date(current.graceEndsAt).toLocaleDateString()}</Text> : null}
      </Card>

      {subscription.data?.usage && Object.keys(subscription.data.usage).length ? (
        <>
          <SectionTitle>Usage</SectionTitle>
          <Card>
            {Object.entries(subscription.data.usage).map(([key, value]) => (
              <ListRow key={key} title={humanizeKey(key)} subtitle={`${value.current} of ${value.limit ?? "unlimited"}`} />
            ))}
          </Card>
        </>
      ) : null}

      {isFree ? (
        <UpgradePrompt
          feature="recurring_trips"
          requiredPlan="PRO_FAMILY"
          message="Pro Family unlocks more children and drivers, saved places, recurring trips, extra viewers, downloadable reports and SMS/WhatsApp alerts."
        />
      ) : null}

      <AppButton label={isFree ? "See plans & upgrade" : "Manage subscription"} icon="card-outline" onPress={() => router.push("/parent/more/billing")} />
      <AppButton label="Pro Family tools" variant="outline" icon="sparkles-outline" onPress={() => router.push("/parent/more/pro")} />

      {subscription.data?.payments?.length ? (
        <>
          <SectionTitle>Recent payments</SectionTitle>
          <Card>
            {subscription.data.payments.slice(0, 5).map((payment) => (
              <ListRow
                key={payment.id}
                icon="receipt-outline"
                title={formatMoney(payment.amountMinor, payment.currency)}
                subtitle={new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                right={payment.status ? <StatusPill label={humanizeStatus(payment.status)} /> : undefined}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
