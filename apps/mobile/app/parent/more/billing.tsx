import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useReducedMotion } from "../../../src/lib/motion";

import { ApiError, apiRequest } from "../../../src/api/client";
import { useToast } from "../../../src/components/toast";
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
} from "../../../src/components/ui";
import { billingKeys, formatMoney, planDependentKeys, useBillingPlans, useBillingSubscription } from "../../../src/hooks/billing";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { openInAppBrowser } from "../../../src/lib/browser";
import { humanizeKey, humanizeStatus } from "../../../src/lib/child-place-label";
import { confirm } from "../../../src/lib/confirm";
import { colors, radius, spacing } from "../../../src/theme";
import type { BillingPlan } from "../../../src/types";

function featureLabels(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "ACTIVE" || status === "TRIALING") return "success";
  if (status === "PAST_DUE" || status === "NON_RENEWING") return "warning";
  if (status === "CANCELLED" || status === "EXPIRED") return "danger";
  return "neutral";
}

function UsageRow({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const reduced = useReducedMotion();
  const percent = limit && limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: percent, duration: reduced ? 0 : 500, useNativeDriver: false }).start();
  }, [percent, reduced, width]);
  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHead}>
        <Text style={textStyles.body}>{label}</Text>
        <Text style={textStyles.muted}>
          {current} / {limit ?? "Unlimited"}
        </Text>
      </View>
      {limit !== null ? (
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              percent >= 100 && styles.fillFull,
              { width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function BillingScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const plans = useBillingPlans();
  const subscription = useBillingSubscription();
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const refreshPlan = () =>
    Promise.all(planDependentKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));

  const checkout = async (plan: BillingPlan) => {
    setPendingCode(plan.code);
    try {
      const data = await apiRequest<{ authorizationUrl: string }>("/api/billing/subscription/checkout", {
        method: "POST",
        body: JSON.stringify({ planCode: plan.code }),
      });
      await openInAppBrowser(data.authorizationUrl);
      await refreshPlan();
      toast.show("If you completed payment, your plan updates in a moment.", { variant: "info", durationMs: 5000 });
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "ROLLOUT_NOT_ENABLED"
          ? "Paid plans are not open for your account yet."
          : error instanceof Error
            ? error.message
            : "Unable to start checkout.";
      toast.show(message, { variant: "error" });
    } finally {
      setPendingCode(null);
    }
  };

  const manage = async () => {
    setPendingCode("manage");
    try {
      const data = await apiRequest<{ url: string }>("/api/billing/subscription/manage", { method: "POST" });
      await openInAppBrowser(data.url);
      await refreshPlan();
    } catch (error) {
      toast.show(error instanceof Error ? error.message : "Unable to open subscription management.", { variant: "error" });
    } finally {
      setPendingCode(null);
    }
  };

  const cancel = useApiMutation(
    () => apiRequest<{ message: string }>("/api/billing/subscription/cancel", { method: "POST" }),
    { invalidate: planDependentKeys, successMessage: (data) => data.message }
  );

  if (plans.isLoading || subscription.isLoading) return <LoadingState label="Loading plans…" />;
  const snapshot = subscription.data;
  const current = snapshot?.current;
  const isPro = current?.planCode.includes("PRO") ?? false;
  const busy = pendingCode !== null || cancel.isPending;

  return (
    <Screen>
      <Header
        eyebrow="Plans & billing"
        title={current?.planName ?? "Free Family"}
        subtitle={
          current?.currentPeriodEnd
            ? `Current period ends ${new Date(current.currentPeriodEnd).toLocaleDateString()}`
            : "Upgrade any time. Safety basics stay free on every plan."
        }
        right={current ? <StatusPill label={humanizeStatus(current.status)} tone={statusTone(current.status)} /> : undefined}
      />

      {isPro ? (
        <Card>
          <Text style={textStyles.cardTitle}>Manage subscription</Text>
          <Text style={textStyles.muted}>Update your card or stop renewal. Access continues until the period ends.</Text>
          <View style={styles.actions}>
            <AppButton label={pendingCode === "manage" ? "Opening…" : "Manage payment method"} variant="outline" icon="card-outline" disabled={busy} onPress={() => void manage()} />
            <AppButton
              label={cancel.isPending ? "Cancelling…" : "Cancel renewal"}
              variant="ghost"
              disabled={busy}
              onPress={async () => {
                const ok = await confirm({
                  title: "Cancel renewal?",
                  message: "Pro Family stays active until the end of the current billing period, then you return to Free Family.",
                  confirmLabel: "Cancel renewal",
                  destructive: true,
                });
                if (ok) cancel.mutate(undefined);
              }}
            />
          </View>
        </Card>
      ) : null}

      {snapshot?.usage && Object.keys(snapshot.usage).length ? (
        <>
          <SectionTitle>Usage</SectionTitle>
          <Card>
            {Object.entries(snapshot.usage).map(([key, value]) => (
              <UsageRow key={key} label={humanizeKey(key)} current={value.current} limit={value.limit} />
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Plans</SectionTitle>
      {plans.data?.length ? (
        plans.data.map((plan) => {
          const isCurrent = plan.code === current?.planCode;
          const paid = plan.tier !== "FREE";
          const checkoutAvailable = plan.isPurchasable && snapshot?.billingAccount.paidCheckoutEnabled === true;
          const label = isCurrent
            ? "Current plan"
            : checkoutAvailable
              ? pendingCode === plan.code
                ? "Opening checkout…"
                : `Upgrade to ${plan.name}`
              : plan.isPurchasable
                ? "Pilot access only"
                : plan.checkoutState === "PAYSTACK_SETUP_REQUIRED"
                  ? "Payment setup pending"
                  : paid
                    ? "Coming soon"
                    : "Included";
          return (
            <Card key={plan.code} style={[styles.plan, isCurrent && styles.planCurrent]}>
              <View style={styles.planHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.description ? <Text style={textStyles.muted}>{plan.description}</Text> : null}
                </View>
                {isCurrent ? <StatusPill label="Current" tone="success" /> : paid ? <Ionicons name="lock-closed-outline" size={18} color={colors.muted} /> : null}
              </View>
              <Text style={styles.price}>
                {plan.price ? formatMoney(plan.price.amountMinor, plan.price.currency) : paid ? "Price pending" : "Free"}
                {plan.price ? <Text style={styles.priceInterval}> / {plan.price.interval.toLowerCase()}</Text> : null}
              </Text>
              <View style={styles.features}>
                {featureLabels(plan.features).map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <AppButton
                label={label}
                variant={isCurrent ? "outline" : "primary"}
                disabled={isCurrent || !checkoutAvailable || busy}
                icon={isCurrent ? undefined : "card-outline"}
                onPress={() => void checkout(plan)}
              />
            </Card>
          );
        })
      ) : (
        <EmptyState title="No plans available" message="Plans could not be loaded. Pull to refresh or try again later." icon="card-outline" />
      )}

      <Card tone="success">
        <Text style={textStyles.body}>
          Emergency controls, active-trip location, pickup and drop-off confirmation, account security and critical push alerts stay available on every plan.
        </Text>
      </Card>

      {snapshot?.payments?.length ? (
        <>
          <SectionTitle>Payments</SectionTitle>
          <Card>
            {snapshot.payments.slice(0, 5).map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.body}>{formatMoney(payment.amountMinor, payment.currency)}</Text>
                  <Text style={textStyles.muted}>{new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString()}</Text>
                </View>
                <StatusPill label={humanizeStatus(payment.status)} tone={statusTone(payment.status === "SUCCESS" ? "ACTIVE" : payment.status)} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  usageRow: { gap: 6, paddingVertical: 6 },
  usageHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  fillFull: { backgroundColor: colors.warning },
  plan: { gap: spacing.md },
  planCurrent: { borderColor: colors.primary },
  planHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  planName: { color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  price: { color: colors.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
  priceInterval: { color: colors.muted, fontSize: 14, fontWeight: "500", letterSpacing: 0 },
  features: { gap: 8 },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6 },
});
