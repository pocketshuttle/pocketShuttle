import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useState } from "react";
import { Animated, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../src/api/client";
import { RevokeSheet } from "../../../src/components/revoke-sheet";
import {
  AppButton,
  Avatar,
  EmptyState,
  IconButton,
  LoadingState,
  PromoCard,
  Screen,
  StatusPill,
  textStyles,
} from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { queryKeys, useConnections, useDriverInvites } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { useDashboard } from "../../../src/hooks/use-dashboard";
import { useUnreadAlertsCount } from "../../../src/hooks/use-unread-alerts";
import { humanizeStatus, timeAgo } from "../../../src/lib/child-place-label";
import { usePressScale } from "../../../src/lib/motion";
import { colors, radius, spacing } from "../../../src/theme";
import type { Connection } from "../../../src/types";

/** Whole-row tap target with press feedback — used only here. */
function PressableCard({ onPress, children, style }: { onPress?(): void; children: ReactNode; style?: object }) {
  const press = usePressScale(!onPress);
  const content = (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.card, style]}
    >
      {children}
    </Pressable>
  );
  return onPress ? <Animated.View style={press.style}>{content}</Animated.View> : content;
}

function driverIsOnTrip(connection: Connection) {
  return connection.assignments.some(
    (a) => a.status === "ACTIVE" && (a.lastStatus === "ON_THE_WAY_TO_SCHOOL" || a.lastStatus === "PICKED_UP")
  );
}

function currentDestination(connection: Connection) {
  const active = connection.assignments.find(
    (a) => a.status === "ACTIVE" && (a.lastStatus === "ON_THE_WAY_TO_SCHOOL" || a.lastStatus === "PICKED_UP")
  );
  return active?.child.address || null;
}

function lastActivityAt(connection: Connection) {
  const stamps = connection.assignments.map((a) => a.lastStatusAt).filter(Boolean) as string[];
  if (!stamps.length) return null;
  return stamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

export default function DriversScreen() {
  const router = useRouter();
  const connections = useConnections("parent");
  const invites = useDriverInvites();
  const dashboard = useDashboard("parent");
  const unreadAlerts = useUnreadAlertsCount("parent");
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const approve = useApiMutation(
    (id: string) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${id}/approve`, { method: "PATCH" }),
    { invalidate: [queryKeys.parentConnections, queryKeys.dashboard], successMessage: "Driver approved." }
  );
  const decline = useApiMutation(
    (id: string) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${id}/decline`, { method: "PATCH" }),
    { invalidate: [queryKeys.parentConnections, queryKeys.dashboard], successMessage: "Request declined." }
  );

  if (connections.isLoading) return <LoadingState label="Loading your drivers…" />;

  const list = connections.data ?? [];
  const pending = list.filter((c) => ["DRIVER_REQUESTED", "INVITED"].includes(c.status));
  const approved = list.filter((c) => c.status === "PARENT_APPROVED");
  const verifiedCount = approved.filter((c) => c.driver.verificationStatus === "VERIFIED").length;
  const verifiedPct = approved.length ? Math.round((verifiedCount / approved.length) * 100) : 0;
  const pendingInvites = (invites.data ?? []).filter((i) => i.status === "PENDING");

  const limits = dashboard.data?.limits;
  const limitReached =
    !!limits &&
    limits.enforcementEnabled &&
    limits.maxConnectedDrivers !== null &&
    limits.driverCount >= limits.maxConnectedDrivers;

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your drivers</Text>
          <Text style={textStyles.muted}>Manage and connect trusted drivers for your children.</Text>
        </View>
        <View style={styles.topRight}>
          {limitReached ? null : (
            <PressableCard onPress={() => router.push("/parent/drivers/add")} style={styles.findChip}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.findChipText}>Find a driver</Text>
            </PressableCard>
          )}
          <IconButton
            icon="notifications-outline"
            badge={unreadAlerts > 0}
            onPress={() => router.push("/parent/more/notifications")}
          />
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="car-sport" size={22} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{approved.length}</Text>
          </View>
          <Text style={textStyles.muted}>Connected</Text>
          <Text style={styles.statHint}>Active now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{verifiedCount}</Text>
          </View>
          <Text style={textStyles.muted}>Verified</Text>
          <Text style={styles.statHint}>{verifiedPct}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.accentOrangeSoft }]}>
              <Ionicons name="car" size={22} color={colors.accentOrange} />
            </View>
            <Text style={styles.statValue}>{pendingInvites.length}</Text>
          </View>
          <Text style={textStyles.muted}>Pending</Text>
          <Text style={styles.statHint}>Invitations</Text>
        </View>
      </View>

      {approve.upgrade ? (
        <UpgradePrompt feature={approve.upgrade.feature} requiredPlan={approve.upgrade.requiredPlan} />
      ) : limitReached ? (
        <UpgradePrompt compact feature="max_connected_drivers" requiredPlan="PRO_FAMILY" />
      ) : null}

      {pending.length ? (
        <>
          <Text style={styles.sectionTitle}>Requests waiting on you</Text>
          <View style={styles.list}>
            {pending.map((connection) => (
              <PressableCard key={connection.id}>
                <View style={styles.driverHead}>
                  <Avatar uri={connection.driver.image} name={connection.driver.full_name} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{connection.driver.full_name}</Text>
                    <Text style={textStyles.muted}>
                      {connection.driver.shareProfile?.shareId || "No share ID"}
                      {connection.note ? ` · "${connection.note}"` : ""}
                    </Text>
                  </View>
                  <StatusPill label={humanizeStatus(connection.status)} />
                </View>
                {connection.status === "DRIVER_REQUESTED" ? (
                  <View style={styles.actionsRow}>
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
              </PressableCard>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Connected drivers</Text>
      {approved.length ? (
        <View style={styles.list}>
          {approved.map((connection) => {
            const onTrip = driverIsOnTrip(connection);
            const destination = currentDestination(connection);
            const lastActive = lastActivityAt(connection);
            const kids = connection.assignments.map((a) => a.child);
            const shownKids = kids.slice(0, 2);
            const extraKids = kids.length - shownKids.length;
            const verified = connection.driver.verificationStatus === "VERIFIED";
            return (
              <PressableCard
                key={connection.id}
                onPress={() => router.push({ pathname: "/parent/drivers/[id]", params: { id: connection.id } })}
              >
                <View style={styles.driverHead}>
                  <View>
                    <Avatar uri={connection.driver.image} name={connection.driver.full_name} size={56} />
                    {onTrip ? <View style={styles.liveDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{connection.driver.full_name}</Text>
                    <View style={styles.driverMetaRow}>
                      <StatusPill
                        label={verified ? "Verified" : humanizeStatus(connection.driver.verificationStatus)}
                        tone={verified ? "success" : "neutral"}
                      />
                      {connection.createdAt ? (
                        <Text style={textStyles.muted}>
                          · Since{" "}
                          {new Date(connection.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <StatusPill label={onTrip ? "On trip" : "Available"} tone="success" />
                </View>

                <View style={styles.tripPanel}>
                  <View style={styles.tripPanelItem}>
                    <Ionicons name="car-outline" size={14} color={colors.primary} />
                    <View>
                      <Text style={styles.tripPanelLabel}>Vehicle</Text>
                      <Text style={styles.tripPanelValue} numberOfLines={1}>
                        {[connection.driver.carMake, connection.driver.carModel].filter(Boolean).join(" ") || "—"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tripPanelDivider} />
                  <View style={styles.tripPanelItem}>
                    <View style={styles.kidStack}>
                      {shownKids.map((kid, index) => (
                        <Avatar
                          key={kid.id}
                          uri={kid.image}
                          name={kid.fullName}
                          size={22}
                          style={index > 0 ? { marginLeft: -8 } : undefined}
                        />
                      ))}
                      {extraKids > 0 ? (
                        <View style={styles.kidExtra}>
                          <Text style={styles.kidExtraText}>+{extraKids}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View>
                      <Text style={styles.tripPanelLabel}>Children</Text>
                      <Text style={styles.tripPanelValue}>{kids.length || "—"}</Text>
                    </View>
                  </View>
                  <View style={styles.tripPanelDivider} />
                  <View style={styles.tripPanelItem}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <View>
                      <Text style={styles.tripPanelLabel}>{onTrip ? "Current trip" : "Last trip"}</Text>
                      <Text style={styles.tripPanelValue} numberOfLines={1}>
                        {onTrip ? destination || "En route" : lastActive ? timeAgo(lastActive) : "No trips yet"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>

                <View style={styles.actionsRow}>
                  {connection.driver.phoneNumber ? (
                    <AppButton
                      label="Contact"
                      variant="outline"
                      icon="call-outline"
                      onPress={() => Linking.openURL(`tel:${connection.driver.phoneNumber}`)}
                    />
                  ) : null}
                  <AppButton
                    label="View trips"
                    variant="outline"
                    icon="map-outline"
                    onPress={() => router.push({ pathname: "/parent/drivers/[id]", params: { id: connection.id } })}
                  />
                </View>
                <AppButton
                  label="Revoke access"
                  variant="ghost"
                  onPress={() => setRevokeTarget({ id: connection.id, name: connection.driver.full_name })}
                />
              </PressableCard>
            );
          })}
        </View>
      ) : (
        <EmptyState title="No approved drivers" message="Approved drivers appear here with their assigned kids." />
      )}

      <Text style={styles.sectionTitle}>Invitations</Text>
      <View style={styles.inviteCard}>
        <View style={styles.inviteIcon}>
          <Ionicons name="mail-outline" size={20} color={colors.accentOrange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>Invite a driver</Text>
          <Text style={textStyles.muted}>Invite a driver by email, phone number or share ID to connect.</Text>
        </View>
        <AppButton label="Send invite" variant="outline" onPress={() => router.push("/parent/drivers/add")} />
      </View>
      {invites.data?.length ? (
        <View style={styles.list}>
          {invites.data.map((invite) => (
            <PressableCard key={invite.id}>
              <View style={styles.driverHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{invite.email || invite.phoneNumber || "Driver invite"}</Text>
                  <Text style={textStyles.muted}>Expires {new Date(invite.expiresAt).toLocaleDateString()}</Text>
                </View>
                <StatusPill label={humanizeStatus(invite.status)} />
              </View>
            </PressableCard>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Need help finding a driver?</Text>
      <PromoCard
        icon="shield-checkmark-outline"
        title="All drivers go through verification"
        body="We verify identity, license and conduct background checks for your family's safety."
        actionLabel="Learn more"
        onPress={() => router.push("/support")}
      />

      <RevokeSheet
        connectionId={revokeTarget?.id ?? null}
        driverName={revokeTarget?.name}
        onClose={() => setRevokeTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  topRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { color: colors.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },

  findChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  findChipText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statCol: { flex: 1, alignItems: "flex-start", gap: 2 },
  statTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
  statDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border, marginHorizontal: spacing.sm },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  statHint: { color: colors.muted, fontSize: 11 },

  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },

  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  driverHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  liveDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  driverName: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  driverMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" },

  tripPanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  tripPanelItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  tripPanelDivider: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  tripPanelLabel: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  tripPanelValue: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  kidStack: { flexDirection: "row", alignItems: "center" },
  kidExtra: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  kidExtraText: { color: colors.primary, fontSize: 10, fontWeight: "800" },

  actionsRow: { flexDirection: "row", gap: spacing.sm },

  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.accentOrangeSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
