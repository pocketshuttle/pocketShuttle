import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../src/api/client";
import { RevokeSheet } from "../../../src/components/revoke-sheet";
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
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { queryKeys, useConnections, useDriverInvites } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { useDashboard } from "../../../src/hooks/use-dashboard";
import { humanizeStatus } from "../../../src/lib/child-place-label";

export default function DriversScreen() {
  const router = useRouter();
  const connections = useConnections("parent");
  const invites = useDriverInvites();
  const dashboard = useDashboard("parent");
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const approve = useApiMutation(
    (id: string) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${id}/approve`, {
        method: "PATCH",
      }),
    {
      invalidate: [queryKeys.parentConnections, queryKeys.dashboard],
      successMessage: "Driver approved.",
    }
  );
  const decline = useApiMutation(
    (id: string) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${id}/decline`, {
        method: "PATCH",
      }),
    { invalidate: [queryKeys.parentConnections, queryKeys.dashboard], successMessage: "Request declined." }
  );

  if (connections.isLoading) return <LoadingState label="Loading your drivers…" />;

  const list = connections.data ?? [];
  const pending = list.filter((c) => ["DRIVER_REQUESTED", "INVITED"].includes(c.status));
  const approved = list.filter((c) => c.status === "PARENT_APPROVED");
  const limits = dashboard.data?.limits;
  const limitReached =
    !!limits &&
    limits.enforcementEnabled &&
    limits.maxConnectedDrivers !== null &&
    limits.driverCount >= limits.maxConnectedDrivers;

  return (
    <Screen>
      <Header
        eyebrow="Known drivers"
        title="Drivers"
        subtitle={
          limits
            ? `${limits.driverCount} of ${limits.maxConnectedDrivers ?? "unlimited"} driver slots used.`
            : "Your trusted driver network."
        }
      />
      {approve.upgrade ? (
        <UpgradePrompt feature={approve.upgrade.feature} requiredPlan={approve.upgrade.requiredPlan} />
      ) : limitReached ? (
        <UpgradePrompt compact feature="max_connected_drivers" requiredPlan="PRO_FAMILY" />
      ) : (
        <AppButton label="Find or invite a driver" onPress={() => router.push("/parent/drivers/add")} />
      )}

      <SectionTitle>Pending</SectionTitle>
      {pending.length ? (
        <View style={styles.list}>
          {pending.map((connection) => (
            <Card key={connection.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.cardTitle}>{connection.driver.full_name}</Text>
                  <Text style={textStyles.muted}>
                    {connection.driver.shareProfile?.shareId || "No share ID"}
                    {connection.note ? ` · "${connection.note}"` : ""}
                  </Text>
                </View>
                <StatusPill label={humanizeStatus(connection.status)} />
              </View>
              {connection.status === "DRIVER_REQUESTED" ? (
                <View style={styles.actions}>
                  <AppButton
                    label={approve.isPending ? "Approving…" : "Approve"}
                    disabled={approve.isPending || decline.isPending}
                    onPress={() => approve.mutate(connection.id)}
                  />
                  <AppButton
                    label="Decline"
                    variant="outline"
                    disabled={approve.isPending || decline.isPending}
                    onPress={() => decline.mutate(connection.id)}
                  />
                </View>
              ) : (
                <Text style={textStyles.muted}>Waiting for the driver to accept your request.</Text>
              )}
              <AppButton
                label="Cancel request"
                variant="outline"
                onPress={() =>
                  setRevokeTarget({ id: connection.id, name: connection.driver.full_name })
                }
              />
            </Card>
          ))}
        </View>
      ) : (
        <Text style={textStyles.muted}>No pending driver requests.</Text>
      )}

      <SectionTitle>Approved</SectionTitle>
      {approved.length ? (
        <Card>
          {approved.map((connection) => (
            <ListRow
              key={connection.id}
              icon="car-outline"
              title={connection.driver.full_name}
              subtitle={`${connection.assignments.length} assigned kid${connection.assignments.length === 1 ? "" : "s"} · ${humanizeStatus(connection.driver.verificationStatus)}`}
              onPress={() =>
                router.push({ pathname: "/parent/drivers/[id]", params: { id: connection.id } })
              }
            />
          ))}
        </Card>
      ) : (
        <EmptyState title="No approved drivers" message="Approved drivers appear here with their assigned kids." />
      )}

      <SectionTitle>Invites</SectionTitle>
      {invites.data?.length ? (
        <Card>
          {invites.data.map((invite) => (
            <ListRow
              key={invite.id}
              icon="mail-outline"
              title={invite.email || invite.phoneNumber || "Driver invite"}
              subtitle={`Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
              right={<StatusPill label={humanizeStatus(invite.status)} />}
            />
          ))}
        </Card>
      ) : (
        <Text style={textStyles.muted}>No registration invites yet.</Text>
      )}

      <RevokeSheet
        connectionId={revokeTarget?.id ?? null}
        driverName={revokeTarget?.name}
        onClose={() => setRevokeTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  actions: { gap: 8 },
});
