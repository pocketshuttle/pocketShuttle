import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../src/api/client";
import { BottomSheet } from "../../../src/components/bottom-sheet";
import {
  AppButton,
  Card,
  EmptyState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "../../../src/components/ui";
import { queryKeys, useConnections } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { humanizeStatus } from "../../../src/lib/child-place-label";
import type { Connection } from "../../../src/types";

export default function FamiliesScreen() {
  const router = useRouter();
  const connections = useConnections("driver");
  const [review, setReview] = useState<Connection | null>(null);

  const decide = useApiMutation(
    (vars: { id: string; action: "approve" | "decline" }) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${vars.id}/${vars.action}`, {
        method: "PATCH",
      }),
    {
      invalidate: [queryKeys.driverConnections, queryKeys.dashboard, queryKeys.knownDriverEvents],
      successMessage: (data) => data.message,
      onSuccess: () => setReview(null),
    }
  );

  if (connections.isLoading) return <LoadingState label="Loading families…" />;

  const list = connections.data ?? [];
  const pending = list.filter(
    (c) => c.status === "INVITED" && c.requestedBy === "parent"
  );
  const waiting = list.filter((c) => c.status === "DRIVER_REQUESTED");
  const approved = list.filter((c) => c.status === "PARENT_APPROVED");

  return (
    <Screen>
      <Header
        eyebrow="Known driver network"
        title="Families"
        subtitle={`${approved.length} approved · ${pending.length} waiting for you`}
      />

      <SectionTitle>Requests for you</SectionTitle>
      {pending.length ? (
        <Card>
          {pending.map((connection) => (
            <ListRow
              key={connection.id}
              icon="person-add-outline"
              title={connection.parent.full_name || "Parent"}
              subtitle={connection.note ? `"${connection.note}"` : "Wants to connect with you"}
              onPress={() => setReview(connection)}
            />
          ))}
        </Card>
      ) : (
        <Text style={textStyles.muted}>No new family requests.</Text>
      )}

      {waiting.length ? (
        <>
          <SectionTitle>Waiting for parent approval</SectionTitle>
          <Card>
            {waiting.map((connection) => (
              <ListRow
                key={connection.id}
                icon="time-outline"
                title={connection.parent.full_name || "Parent"}
                subtitle="You requested this family"
                right={<StatusPill label="Pending" />}
              />
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Approved families</SectionTitle>
      {approved.length ? (
        <Card>
          {approved.map((connection) => (
            <ListRow
              key={connection.id}
              icon="people-outline"
              title={connection.parent.full_name || "Parent"}
              subtitle={`${connection.assignments.length} assigned kid${connection.assignments.length === 1 ? "" : "s"}`}
              onPress={() =>
                router.push({ pathname: "/driver/families/[id]", params: { id: connection.id } })
              }
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="No approved families yet"
          message="Share your ID with parents so they can request you."
        />
      )}

      <BottomSheet visible={review !== null} onClose={() => setReview(null)} title="Family request">
        {review ? (
          <>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>{review.parent.full_name || "Parent"}</Text>
                <Text style={textStyles.muted}>{review.parent.phoneNumber || "No phone number"}</Text>
              </View>
              <StatusPill label={humanizeStatus(review.status)} />
            </View>
            {review.note ? <Text style={textStyles.body}>"{review.note}"</Text> : null}
            <Text style={textStyles.muted}>
              Approving lets this parent assign their children to you and see your shared location.
            </Text>
            {review.parent.phoneNumber ? (
              <AppButton
                label="Call parent"
                variant="outline"
                onPress={() => Linking.openURL(`tel:${review.parent.phoneNumber}`)}
              />
            ) : null}
            <AppButton
              label={decide.isPending ? "Working…" : "Approve"}
              variant="success"
              disabled={decide.isPending}
              onPress={() => decide.mutate({ id: review.id, action: "approve" })}
            />
            <AppButton
              label="Decline"
              variant="outline"
              disabled={decide.isPending}
              onPress={() => decide.mutate({ id: review.id, action: "decline" })}
            />
            {decide.upgrade ? (
              <Text style={styles.upgradeNote}>
                This parent has reached their plan's driver limit. Ask them to upgrade, then try again.
              </Text>
            ) : null}
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  upgradeNote: { color: "#92400E", fontSize: 14, lineHeight: 20 },
});
