import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../../src/api/client";
import { BottomSheet } from "../../../../src/components/bottom-sheet";
import { AppButton, Card, Chips, EmptyState, FormField, Header, LoadingState, Screen, StatusPill, textStyles } from "../../../../src/components/ui";
import { UpgradePrompt } from "../../../../src/components/upgrade-prompt";
import { billingKeys, isEntitled, useParentPro, useTripTemplates } from "../../../../src/hooks/billing";
import { useApiMutation } from "../../../../src/hooks/use-api-mutation";
import { humanizeStatus } from "../../../../src/lib/child-place-label";
import { confirm } from "../../../../src/lib/confirm";
import { colors, spacing } from "../../../../src/theme";

type Frequency = "DAILY" | "WEEKLY";
type DayOffset = "1" | "2" | "3" | "7";

const dayOptions: Array<{ value: DayOffset; label: string }> = [
  { value: "1", label: "Tomorrow" },
  { value: "2", label: "In 2 days" },
  { value: "3", label: "In 3 days" },
  { value: "7", label: "Next week" },
];

const invalidate = [billingKeys.templates, billingKeys.pro, ["parent-connections"], ["mobile-dashboard"]];

function firstRun(dayOffset: DayOffset, time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(dayOffset));
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function TemplatesScreen() {
  const pro = useParentPro();
  const templates = useTripTemplates();
  const entitled = isEntitled(pro.data?.plan.entitlements, "recurring_trips");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("WEEKLY");
  const [dayOffset, setDayOffset] = useState<DayOffset>("1");
  const [time, setTime] = useState("07:00");
  const [error, setError] = useState<string | null>(null);

  const create = useApiMutation(
    (nextRunAt: Date) =>
      apiRequest<{ message: string }>("/api/trip-templates", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), tripType: "family_trip", schedule: { frequency }, nextRunAt: nextRunAt.toISOString() }),
      }),
    {
      invalidate,
      successMessage: "Recurring trip created.",
      onSuccess: () => {
        setOpen(false);
        setTitle("");
        setFrequency("WEEKLY");
        setDayOffset("1");
        setTime("07:00");
      },
    }
  );

  const toggle = useApiMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest<{ message: string }>(`/api/trip-templates/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    { invalidate, successMessage: (data) => data.message }
  );

  const disable = useApiMutation(
    (id: string) => apiRequest<{ message: string }>(`/api/trip-templates/${id}`, { method: "DELETE" }),
    { invalidate, successMessage: "Recurring trip removed." }
  );

  const submit = () => {
    if (!title.trim()) return setError("Give the trip a title.");
    const runAt = firstRun(dayOffset, time);
    if (!runAt) return setError("Enter the time as HH:MM, e.g. 07:00.");
    setError(null);
    create.mutate(runAt);
  };

  if (pro.isLoading || templates.isLoading) return <LoadingState label="Loading recurring trips…" />;
  const list = templates.data ?? [];
  const preview = firstRun(dayOffset, time);

  return (
    <Screen>
      <Header
        eyebrow="Pro Family"
        title="Recurring trips"
        subtitle="Trips that repeat daily or weekly. Your connected drivers see the schedule."
        right={entitled ? <AppButton label="New" icon="add" variant="outline" onPress={() => setOpen(true)} /> : undefined}
      />
      {!entitled ? <UpgradePrompt feature="recurring_trips" requiredPlan="PRO_FAMILY" /> : null}
      {create.upgrade ? <UpgradePrompt feature={create.upgrade.feature} requiredPlan={create.upgrade.requiredPlan} /> : null}

      {list.length ? (
        list.map((template) => (
          <Card key={template.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>{template.title}</Text>
                <Text style={textStyles.muted}>
                  {template.schedule?.frequency ? humanizeStatus(template.schedule.frequency) : "Scheduled"}
                  {template.nextRunAt ? ` · next ${new Date(template.nextRunAt).toLocaleString()}` : ""}
                </Text>
              </View>
              <StatusPill label={template.isActive ? "Active" : "Paused"} tone={template.isActive ? "success" : "neutral"} />
            </View>
            {entitled ? (
              <View style={styles.actions}>
                <AppButton
                  label={template.isActive ? "Pause" : "Resume"}
                  variant="outline"
                  disabled={toggle.isPending}
                  onPress={() => toggle.mutate({ id: template.id, isActive: !template.isActive })}
                />
                <AppButton
                  label="Remove"
                  variant="ghost"
                  disabled={disable.isPending}
                  onPress={async () => {
                    const ok = await confirm({ title: `Remove ${template.title}?`, message: "This stops the schedule. You can create it again later.", confirmLabel: "Remove", destructive: true });
                    if (ok) disable.mutate(template.id);
                  }}
                />
              </View>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState
          icon="repeat-outline"
          title="No recurring trips"
          message="Set up the school run once and let it repeat."
          action={entitled ? <AppButton label="Create a recurring trip" onPress={() => setOpen(true)} /> : undefined}
        />
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="New recurring trip">
        <FormField label="Title" placeholder="e.g. Morning school run" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
        <Text style={styles.label}>Repeats</Text>
        <Chips<Frequency>
          options={[
            { value: "DAILY", label: "Daily" },
            { value: "WEEKLY", label: "Weekly" },
          ]}
          value={frequency}
          onChange={(value) => setFrequency(value)}
        />
        <Text style={styles.label}>First run</Text>
        <Chips<DayOffset> options={dayOptions} value={dayOffset} onChange={(value) => setDayOffset(value)} />
        <FormField label="Time" placeholder="07:00" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" error={error} hint={preview ? `Starts ${preview.toLocaleString()}` : undefined} />
        <AppButton label={create.isPending ? "Creating…" : "Create recurring trip"} disabled={create.isPending} onPress={submit} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  actions: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700" },
});
