import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { ApiError, apiRaw, apiRequest } from "../api/client";
import { billingKeys, useViewerInvites } from "../hooks/billing";
import { upgradeFromError, useApiMutation, type UpgradeRequired } from "../hooks/use-api-mutation";
import { E164_PATTERN, humanizeStatus } from "../lib/child-place-label";
import { confirm } from "../lib/confirm";
import { colors, spacing } from "../theme";
import { BottomSheet } from "./bottom-sheet";
import { useToast } from "./toast";
import { AppButton, Card, FormField, StatusPill, textStyles } from "./ui";
import { UpgradePrompt } from "./upgrade-prompt";

/**
 * Pro Family extras on a parent-owned family trip: invite viewers / emergency
 * contacts and export the CSV report. Both are entitlement-gated server-side.
 */
export function TripViewersCard({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const toast = useToast();
  const invites = useViewerInvites(tripId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportUpgrade, setReportUpgrade] = useState<UpgradeRequired | null>(null);

  const invalidate = [billingKeys.viewerInvites(tripId), billingKeys.pro, billingKeys.subscription];

  const create = useApiMutation(
    () =>
      apiRequest<{ message: string; inviteUrl?: string }>(`/api/trips/${tripId}/viewer-invites`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phoneNumber: phone.trim() || undefined,
          emergencyContact: emergency,
          expiresInDays: 7,
        }),
      }),
    {
      invalidate,
      successMessage: "Viewer invitation sent.",
      onSuccess: () => {
        setOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        setEmergency(false);
      },
    }
  );

  const resend = useApiMutation(
    (id: string) => apiRequest<{ message: string }>(`/api/trips/${tripId}/viewer-invites/${id}/resend`, { method: "POST" }),
    { invalidate, successMessage: (data) => data.message }
  );

  const revoke = useApiMutation(
    (id: string) => apiRequest<{ message: string }>(`/api/trips/${tripId}/viewer-invites/${id}`, { method: "DELETE" }),
    { invalidate, successMessage: "Invitation revoked." }
  );

  const submit = () => {
    if (!name.trim()) return setError("Add the viewer's name.");
    if (!email.trim() && !phone.trim()) return setError("Add an email or a phone number.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email.");
    if (phone.trim() && !E164_PATTERN.test(phone.trim())) return setError("Phone must be international, e.g. +2348012345678.");
    setError(null);
    create.mutate(undefined);
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const csv = await apiRaw(`/api/trips/${tripId}/report`);
      const safeTitle = tripTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "trip";
      const path = `${FileSystem.cacheDirectory}${safeTitle}-${tripId.slice(0, 8)}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Share trip report", UTI: "public.comma-separated-values-text" });
      } else {
        toast.show(`Report saved to ${path}`, { variant: "success" });
      }
      setReportUpgrade(null);
    } catch (caught) {
      const upgrade = upgradeFromError(caught);
      if (upgrade) setReportUpgrade(upgrade);
      else toast.show(caught instanceof ApiError ? caught.message : "Unable to export the report.", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const list = invites.data ?? [];

  return (
    <Card>
      <Text style={textStyles.cardTitle}>Viewers & report</Text>
      <Text style={textStyles.muted}>Let a relative follow this trip, mark them as an emergency contact, or export the full CSV.</Text>
      {create.upgrade ? <UpgradePrompt compact feature={create.upgrade.feature} requiredPlan={create.upgrade.requiredPlan} /> : null}
      {reportUpgrade ? <UpgradePrompt compact feature={reportUpgrade.feature} requiredPlan={reportUpgrade.requiredPlan} /> : null}

      {list.length ? (
        <View style={styles.list}>
          {list.map((invite) => (
            <View key={invite.id} style={styles.invite}>
              <View style={styles.inviteHead}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.body}>
                    {invite.name}
                    {invite.emergencyContact ? " · Emergency contact" : ""}
                  </Text>
                  <Text style={textStyles.muted}>
                    {invite.email || invite.phoneNumber} · {humanizeStatus(invite.deliveryStatus)} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusPill label={humanizeStatus(invite.status)} tone={invite.status === "ACCEPTED" ? "success" : invite.status === "PENDING" ? "warning" : "neutral"} />
              </View>
              {invite.status === "PENDING" ? (
                <View style={styles.inviteActions}>
                  {invite.email ? (
                    <AppButton label={resend.isPending && resend.variables === invite.id ? "Resending…" : "Resend"} variant="outline" disabled={resend.isPending} onPress={() => resend.mutate(invite.id)} />
                  ) : null}
                  <AppButton
                    label="Revoke"
                    variant="ghost"
                    disabled={revoke.isPending}
                    onPress={async () => {
                      const ok = await confirm({ title: `Revoke ${invite.name}'s invitation?`, confirmLabel: "Revoke", destructive: true });
                      if (ok) revoke.mutate(invite.id);
                    }}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : invites.isLoading ? null : (
        <Text style={textStyles.muted}>No viewers invited yet.</Text>
      )}

      <View style={styles.actions}>
        <AppButton label="Invite a viewer" icon="person-add-outline" onPress={() => setOpen(true)} />
        <AppButton label={exporting ? "Preparing report…" : "Download CSV report"} variant="outline" icon="download-outline" disabled={exporting} onPress={() => void exportReport()} />
      </View>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Invite a viewer">
        <FormField label="Name" placeholder="e.g. Aunty Bisi" value={name} onChangeText={setName} autoCapitalize="words" />
        <FormField label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Phone (optional)" placeholder="+2348012345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={error} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={textStyles.body}>Emergency contact</Text>
            <Text style={textStyles.muted}>They are alerted first when an emergency is triggered.</Text>
          </View>
          <Switch value={emergency} onValueChange={setEmergency} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        <AppButton label={create.isPending ? "Sending…" : "Send invitation"} disabled={create.isPending} onPress={submit} />
        <Text style={textStyles.muted}>Invitations expire after 7 days.</Text>
      </BottomSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  invite: { gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  inviteHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  inviteActions: { flexDirection: "row", gap: spacing.sm },
  actions: { gap: spacing.sm },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
