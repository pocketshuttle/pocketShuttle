import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../../src/api/client";
import { AppButton, Card, EmptyState, Header, LoadingState, Screen, textStyles } from "../../../../src/components/ui";
import { UpgradePrompt } from "../../../../src/components/upgrade-prompt";
import { billingKeys, isEntitled, useParentPro, useRecurringSuggestions } from "../../../../src/hooks/billing";
import { useApiMutation } from "../../../../src/hooks/use-api-mutation";
import { spacing } from "../../../../src/theme";

export default function SuggestionsScreen() {
  const pro = useParentPro();
  const suggestions = useRecurringSuggestions();
  const entitled = isEntitled(pro.data?.plan.entitlements, "recurring_trips");

  const respond = useApiMutation(
    ({ id, action }: { id: string; action: "accept" | "dismiss" }) =>
      apiRequest<{ message: string }>(`/api/parent/recurring-trip-suggestions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
    {
      invalidate: [billingKeys.suggestions, billingKeys.templates, billingKeys.pro, ["mobile-dashboard"]],
      successMessage: (data) => data.message,
    }
  );

  if (pro.isLoading || suggestions.isLoading) return <LoadingState label="Checking your trips…" />;
  const list = suggestions.data ?? [];

  return (
    <Screen>
      <Header eyebrow="Pro Family" title="Trip suggestions" subtitle="When you take the same trip four or more times in 60 days, we offer to schedule it." />
      {respond.upgrade ? <UpgradePrompt feature={respond.upgrade.feature} requiredPlan={respond.upgrade.requiredPlan} /> : null}
      {!entitled && list.length ? (
        <UpgradePrompt feature="recurring_trips" requiredPlan="PRO_FAMILY" message="Turning a suggestion into a recurring trip requires Pro Family. You can still dismiss suggestions." />
      ) : null}
      {list.length ? (
        list.map((suggestion) => {
          const busy = respond.isPending && respond.variables?.id === suggestion.id;
          return (
            <Card key={suggestion.id}>
              <Text style={textStyles.cardTitle}>{suggestion.destinationLabel || "The same spot"}</Text>
              <Text style={textStyles.body}>
                We noticed <Text style={styles.strong}>{suggestion.occurrenceCount} trips</Text> to{" "}
                <Text style={styles.strong}>{suggestion.destinationLabel || "the same spot"}</Text> in the last 60 days. Turn this into a weekly recurring trip?
              </Text>
              <View style={styles.actions}>
                <AppButton
                  label={busy && respond.variables?.action === "accept" ? "Creating…" : "Accept"}
                  disabled={respond.isPending || !entitled}
                  onPress={() => respond.mutate({ id: suggestion.id, action: "accept" })}
                />
                <AppButton
                  label={busy && respond.variables?.action === "dismiss" ? "Dismissing…" : "Dismiss"}
                  variant="outline"
                  disabled={respond.isPending}
                  onPress={() => respond.mutate({ id: suggestion.id, action: "dismiss" })}
                />
              </View>
            </Card>
          );
        })
      ) : (
        <EmptyState icon="sparkles-outline" title="No suggestions yet" message="Keep using PocketShuttle. Repeated trips to the same place will show up here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: "800" },
  actions: { gap: spacing.sm },
});
