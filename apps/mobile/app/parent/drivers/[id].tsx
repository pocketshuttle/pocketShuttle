import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../src/api/client";
import { RevokeSheet } from "../../../src/components/revoke-sheet";
import {
  AppButton,
  Card,
  Chips,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "../../../src/components/ui";
import { queryKeys, useConnections, useParentChildren } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { openInAppBrowser } from "../../../src/lib/browser";
import { childPlaceLabel, humanizeStatus, timeAgo } from "../../../src/lib/child-place-label";

const ASSIGNMENT_PAYMENTS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_ASSIGNMENT_PAYMENTS === "true";

function billingLabel(assignment: { billingStatus?: string | null; trialEndsAt?: string | null }) {
  if (assignment.billingStatus === "FREE_TRIAL") {
    return assignment.trialEndsAt ? `Free trial until ${new Date(assignment.trialEndsAt).toLocaleDateString()}` : "Free trial";
  }
  if (assignment.billingStatus === "PAST_DUE") return "Payment overdue";
  if (assignment.billingStatus === "ACTIVE") return "Paid this month";
  return null;
}

export default function DriverDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const connections = useConnections("parent");
  const children = useParentChildren();
  const [selected, setSelected] = useState<string[]>([]);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const connection = connections.data?.find((item) => item.id === id);

  const pay = useApiMutation(
    (assignmentId: string) =>
      apiRequest<{ message: string; payment?: { authorizationUrl?: string | null } }>("/api/billing/paystack/initialize", {
        method: "POST",
        body: JSON.stringify({ assignmentId }),
      }),
    {
      invalidate: [queryKeys.parentConnections, queryKeys.dashboard],
      successMessage: (data) => (data.payment?.authorizationUrl ? "Complete the payment in the browser." : data.message),
      onSuccess: async (data) => {
        if (data.payment?.authorizationUrl) await openInAppBrowser(data.payment.authorizationUrl);
      },
    }
  );

  const assign = useApiMutation(
    (childIds: string[]) =>
      apiRequest<{ message: string }>("/api/child-driver-assignments", {
        method: "POST",
        body: JSON.stringify({ connectionId: id, childIds }),
      }),
    {
      invalidate: [queryKeys.parentConnections, queryKeys.dashboard, queryKeys.parentChildren],
      successMessage: "Children assigned.",
      onSuccess: () => setSelected([]),
    }
  );
  const requestLocation = useApiMutation(
    (assignmentId: string) =>
      apiRequest<{ message: string }>(
        `/api/child-driver-assignments/${assignmentId}/location-request`,
        { method: "POST" }
      ),
    { invalidate: [queryKeys.knownDriverEvents], successMessage: "Location request sent." }
  );

  if (connections.isLoading) return <LoadingState label="Loading driver…" />;
  if (!connection) {
    return (
      <Screen>
        <Header title="Driver" />
        <EmptyState title="Not found" message="This driver is no longer connected." />
      </Screen>
    );
  }

  const driver = connection.driver;
  const assignedChildIds = new Set(
    connection.assignments.filter((a) => a.status === "ACTIVE").map((a) => a.child.id)
  );
  const assignable = (children.data ?? []).filter((child) => !assignedChildIds.has(child.id));
  const live = driver.liveAddress;
  const hasLive = typeof live?.latitude === "number" && typeof live?.longitude === "number";

  const selectAllAtSameSchool = () => {
    const anchor = assignable.find((child) => selected.includes(child.id)) ?? assignable[0];
    if (!anchor?.address) return;
    const key = anchor.address.trim().toLowerCase();
    setSelected(
      assignable
        .filter((child) => (child.address ?? "").trim().toLowerCase() === key)
        .map((child) => child.id)
    );
  };

  return (
    <Screen>
      <Header
        eyebrow={humanizeStatus(connection.status)}
        title={driver.full_name}
        subtitle={[
          driver.shareProfile?.shareId,
          humanizeStatus(driver.verificationStatus || "UNSUBMITTED"),
          `Active ${timeAgo(driver.lastActiveAt)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <View style={styles.actions}>
        {driver.phoneNumber ? (
          <AppButton
            label="Call driver"
            variant="outline"
            onPress={() => Linking.openURL(`tel:${driver.phoneNumber}`)}
          />
        ) : null}
        <AppButton
          label={hasLive ? "View live location" : "No location shared yet"}
          variant="outline"
          disabled={!hasLive}
          onPress={() =>
            router.push({ pathname: "/parent/drivers/map", params: { driverId: driver.id } })
          }
        />
      </View>

      {connection.status === "PARENT_APPROVED" ? (
        <>
          <SectionTitle>Assign children</SectionTitle>
          {assignable.length ? (
            <Card>
              <Chips
                multiple
                options={assignable.map((child) => ({
                  value: child.id,
                  label: child.fullName,
                }))}
                value={selected}
                onChange={setSelected}
              />
              <View style={styles.actions}>
                <AppButton
                  label="Select all at the same school"
                  variant="outline"
                  onPress={selectAllAtSameSchool}
                />
                <AppButton
                  label={assign.isPending ? "Assigning…" : `Assign ${selected.length || ""} ${selected.length === 1 ? "child" : "children"}`.replace("  ", " ")}
                  disabled={!selected.length || assign.isPending}
                  onPress={() => assign.mutate(selected)}
                />
              </View>
            </Card>
          ) : (
            <Text style={textStyles.muted}>
              {children.data?.length
                ? "All your children are already assigned to this driver."
                : "Add a child first, then assign them here."}
            </Text>
          )}
        </>
      ) : null}

      <SectionTitle>Assigned kids</SectionTitle>
      {connection.assignments.length ? (
        <View style={styles.list}>
          {connection.assignments.map((assignment) => (
            <Card key={assignment.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={textStyles.cardTitle}>{assignment.child.fullName}</Text>
                  <Text style={textStyles.muted}>
                    {assignment.child.address || "No school address"} · {humanizeStatus(assignment.status)}
                  </Text>
                </View>
                <StatusPill label={childPlaceLabel(assignment)} />
              </View>
              <Text style={textStyles.muted}>
                Last update {timeAgo(assignment.lastStatusAt)}
                {billingLabel(assignment) ? ` · ${billingLabel(assignment)}` : ""}
              </Text>
              {ASSIGNMENT_PAYMENTS_ENABLED && assignment.status === "ACTIVE" && assignment.billingStatus !== "ACTIVE" ? (
                <AppButton
                  label={pay.isPending && pay.variables === assignment.id ? "Starting payment…" : "Pay monthly fee"}
                  icon="card-outline"
                  disabled={pay.isPending}
                  onPress={() => pay.mutate(assignment.id)}
                />
              ) : null}
              <AppButton
                label={requestLocation.isPending ? "Requesting…" : "Request driver location"}
                variant="outline"
                disabled={requestLocation.isPending}
                onPress={() => requestLocation.mutate(assignment.id)}
              />
            </Card>
          ))}
        </View>
      ) : (
        <Text style={textStyles.muted}>No children assigned yet.</Text>
      )}

      {connection.status !== "REVOKED" && connection.status !== "DECLINED" ? (
        <AppButton label="Revoke driver access" variant="danger" onPress={() => setRevokeOpen(true)} />
      ) : null}
      <RevokeSheet
        connectionId={revokeOpen ? connection.id : null}
        driverName={driver.full_name}
        onClose={() => {
          setRevokeOpen(false);
          if (connections.data?.find((item) => item.id === id)?.status === "REVOKED") router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  actions: { gap: 8 },
});
