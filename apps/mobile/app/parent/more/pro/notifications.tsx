import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { apiRequest } from "../../../../src/api/client";
import { AppButton, Card, FormField, Header, LoadingState, Screen, SectionTitle, StatusPill, textStyles } from "../../../../src/components/ui";
import { UpgradePrompt } from "../../../../src/components/upgrade-prompt";
import { billingKeys, isEntitled, useNotificationPreferences, useParentPro } from "../../../../src/hooks/billing";
import { useApiMutation } from "../../../../src/hooks/use-api-mutation";
import { E164_PATTERN, humanizeStatus } from "../../../../src/lib/child-place-label";
import { colors, spacing } from "../../../../src/theme";
import type { NotificationChannel } from "../../../../src/types";

const channelCopy: Record<NotificationChannel, { title: string; subtitle: string }> = {
  PUSH: { title: "Push notifications", subtitle: "Included on every plan." },
  SMS: { title: "SMS", subtitle: "Text message for pickup, drop-off and safety alerts." },
  WHATSAPP: { title: "WhatsApp", subtitle: "WhatsApp message for pickup, drop-off and safety alerts." },
};

export default function NotificationPrefsScreen() {
  const pro = useParentPro();
  const prefs = useNotificationPreferences();
  const entitled = isEntitled(pro.data?.plan.entitlements, "premium_notifications");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    const saved = prefs.data?.find((pref) => pref.channel !== "PUSH" && pref.destination)?.destination;
    if (saved && !phone) setPhone(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.data]);

  const save = useApiMutation(
    ({ channel, enabled }: { channel: NotificationChannel; enabled: boolean }) =>
      apiRequest<{ message: string }>("/api/billing/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ channel, enabled, destination: channel === "PUSH" ? null : phone.trim() }),
      }),
    { invalidate: [billingKeys.preferences, billingKeys.pro], successMessage: (data) => data.message }
  );

  const toggle = (channel: NotificationChannel, enabled: boolean) => {
    if (enabled && channel !== "PUSH" && !E164_PATTERN.test(phone.trim())) {
      setPhoneError("Use an international number such as +2348012345678.");
      return;
    }
    setPhoneError(null);
    save.mutate({ channel, enabled });
  };

  if (pro.isLoading || prefs.isLoading) return <LoadingState label="Loading alert settings…" />;
  const list = prefs.data ?? [];
  const deliveries = pro.data?.deliveries ?? [];

  return (
    <Screen>
      <Header eyebrow="Pro Family" title="SMS & WhatsApp alerts" subtitle="Get pickup, drop-off and safety alerts even when the app is closed." />
      {!entitled ? <UpgradePrompt feature="premium_notifications" requiredPlan="PRO_FAMILY" /> : null}
      {save.upgrade ? <UpgradePrompt feature={save.upgrade.feature} requiredPlan={save.upgrade.requiredPlan} /> : null}

      <Card>
        <FormField
          label="Phone number for SMS and WhatsApp"
          placeholder="+2348012345678"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (phoneError) setPhoneError(null);
          }}
          keyboardType="phone-pad"
          autoCapitalize="none"
          error={phoneError}
          hint="International format, starting with +."
          editable={entitled}
        />
        {list.map((pref) => {
          const busy = save.isPending && save.variables?.channel === pref.channel;
          const locked = pref.channel !== "PUSH" && !entitled;
          return (
            <View key={pref.channel} style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.body}>{channelCopy[pref.channel].title}</Text>
                <Text style={textStyles.muted}>
                  {pref.enabled && pref.destination ? `On · ${pref.destination}` : channelCopy[pref.channel].subtitle}
                </Text>
              </View>
              {locked ? (
                <StatusPill label="Pro" />
              ) : (
                <Switch
                  value={pref.enabled}
                  disabled={busy || save.isPending}
                  onValueChange={(value) => toggle(pref.channel, value)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              )}
            </View>
          );
        })}
        {entitled && phone.trim() && list.some((pref) => pref.enabled && pref.channel !== "PUSH" && pref.destination !== phone.trim()) ? (
          <AppButton
            label="Update number on enabled channels"
            variant="outline"
            disabled={save.isPending}
            onPress={() =>
              list
                .filter((pref) => pref.enabled && pref.channel !== "PUSH")
                .forEach((pref) => toggle(pref.channel, true))
            }
          />
        ) : null}
      </Card>

      <SectionTitle>Delivery activity</SectionTitle>
      <Card>
        {deliveries.length ? (
          deliveries.map((delivery) => (
            <View key={delivery.id} style={styles.delivery}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.body}>{delivery.eventType ? humanizeStatus(delivery.eventType) : "Notification"}</Text>
                <Text style={textStyles.muted}>
                  {delivery.channel} · {new Date(delivery.createdAt).toLocaleString()}
                </Text>
              </View>
              <StatusPill label={humanizeStatus(delivery.status)} tone={delivery.status === "FAILED" ? "danger" : delivery.status === "SENT" || delivery.status === "DELIVERED" ? "success" : "neutral"} />
            </View>
          ))
        ) : (
          <Text style={textStyles.muted}>No SMS or WhatsApp deliveries yet.</Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10 },
  delivery: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6 },
});
