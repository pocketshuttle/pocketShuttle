import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  EmptyState,
  IconName,
  LoadingState,
  PromoCard,
  Screen,
  StatusPill,
  textStyles,
} from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { useParentChildren } from "../../../src/hooks/marketplace";
import { useDashboard } from "../../../src/hooks/use-dashboard";
import { childPlaceLabel, timeAgo } from "../../../src/lib/child-place-label";
import { usePressScale } from "../../../src/lib/motion";
import { colors, radius, spacing } from "../../../src/theme";

function tripProgress(lastStatus?: string | null) {
  if (lastStatus === "DROPPED_OFF") return 1;
  if (lastStatus === "PICKED_UP") return 0.66;
  if (lastStatus === "ON_THE_WAY_TO_SCHOOL") return 0.33;
  return 0;
}

function statusTone(lastStatus?: string | null): "success" | "neutral" {
  return lastStatus === "ON_THE_WAY_TO_SCHOOL" || lastStatus === "PICKED_UP" ? "success" : "neutral";
}

/** Pressable row wrapper — the whole kid card / add-child card is tappable, used only here. */
function PressableCard({ onPress, children, style }: { onPress(): void; children: ReactNode; style?: object }) {
  const press = usePressScale();
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.card, style]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function KidsScreen() {
  const router = useRouter();
  const children = useParentChildren();
  const dashboard = useDashboard("parent");
  const limits = dashboard.data?.limits;
  const assignments = dashboard.data?.assignments ?? [];
  const limitReached =
    !!limits &&
    limits.enforcementEnabled &&
    limits.maxChildren !== null &&
    (children.data?.length ?? limits.childCount) >= limits.maxChildren;

  if (children.isLoading || dashboard.isLoading) return <LoadingState label="Loading children…" />;

  const activeAssignmentFor = (childId: string) =>
    assignments.find((a) => a.child.id === childId && a.status === "ACTIVE");

  const activeCount = (children.data ?? []).filter((child) => activeAssignmentFor(child.id)).length;
  const onTheWayCount = assignments.filter(
    (a) => a.status === "ACTIVE" && (a.lastStatus === "ON_THE_WAY_TO_SCHOOL" || a.lastStatus === "PICKED_UP")
  ).length;
  const atSchoolCount = assignments.filter(
    (a) => a.status === "ACTIVE" && childPlaceLabel(a) === "In school"
  ).length;

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your kids</Text>
          <Text style={textStyles.muted}>Track their journeys and stay updated in real time.</Text>
        </View>
        <PressableCard onPress={() => router.push("/parent/kids/add")} style={styles.addChipCard}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addChipText}>Add child</Text>
        </PressableCard>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{children.data?.length ?? 0}</Text>
          </View>
          <Text style={textStyles.muted}>Total kids</Text>
          <Text style={styles.statHint}>{activeCount} active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{onTheWayCount}</Text>
          </View>
          <Text style={textStyles.muted}>On the way</Text>
          <Text style={styles.statHint}>Right now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statTop}>
            <View style={[styles.statIcon, { backgroundColor: colors.accentOrangeSoft }]}>
              <Ionicons name="school" size={22} color={colors.accentOrange} />
            </View>
            <Text style={styles.statValue}>{atSchoolCount}</Text>
          </View>
          <Text style={textStyles.muted}>At school</Text>
          <Text style={styles.statHint}>Today</Text>
        </View>
      </View>

      {limitReached ? <UpgradePrompt compact feature="max_children" requiredPlan="PRO_FAMILY" /> : null}

      <Text style={styles.sectionTitle}>All kids</Text>

      {children.data?.length ? (
        <View style={styles.list}>
          {children.data.map((child) => {
            const assignment = activeAssignmentFor(child.id);
            const pickedUpAt = assignment?.events?.find((e) => e.eventType === "PICKED_UP")?.createdAt;
            const progress = tripProgress(assignment?.lastStatus);
            return (
              <PressableCard
                key={child.id}
                onPress={() => router.push({ pathname: "/parent/kids/[id]", params: { id: child.id } })}
              >
                <View style={styles.kidHead}>
                  <View>
                    <Avatar uri={child.image} name={child.fullName} size={56} />
                    {assignment ? <View style={styles.liveDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kidName}>{child.fullName}</Text>
                    <View style={styles.kidMetaRow}>
                      {child.grade ? (
                        <View style={styles.gradePill}>
                          <Text style={styles.gradePillText}>{child.grade}</Text>
                        </View>
                      ) : null}
                      <Text style={textStyles.muted}>{child.grade ? "· " : ""}{child.address || "No school address"}</Text>
                    </View>
                  </View>
                  {assignment ? (
                    <StatusPill label={childPlaceLabel(assignment)} tone={statusTone(assignment.lastStatus)} />
                  ) : null}
                </View>

                {assignment ? (
                  <>
                    <View style={styles.tripPanel}>
                      <TripPanelItem icon="person-outline" label="Driver" value={assignment.driver.full_name} />
                      <View style={styles.tripPanelDivider} />
                      <TripPanelItem
                        icon="car-outline"
                        label="Vehicle"
                        value={
                          [assignment.driver.carMake, assignment.driver.carModel].filter(Boolean).join(" ") ||
                          assignment.driver.plateNumber ||
                          "—"
                        }
                      />
                      <View style={styles.tripPanelDivider} />
                      <TripPanelItem icon="time-outline" label="Updated" value={timeAgo(assignment.lastStatusAt)} />
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </View>

                    <View style={styles.progressRow}>
                      <View style={styles.progressLabel}>
                        <View style={[styles.dot, styles.dotFilled]} />
                        <View>
                          <Text style={styles.progressText}>Picked up</Text>
                          <Text style={styles.progressTime}>{pickedUpAt ? timeAgo(pickedUpAt) : "Not yet"}</Text>
                        </View>
                      </View>
                      <View style={styles.track}>
                        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                        <View style={[styles.trackMarker, { left: `${Math.min(92, progress * 100)}%` }]}>
                          <Ionicons name="car-sport" size={12} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.progressLabel}>
                        <View style={[styles.dot, progress >= 1 && styles.dotFilled]} />
                        <View>
                          <Text style={styles.progressText}>Arriving</Text>
                          <Text style={styles.progressTime}>
                            {assignment.lastStatus === "DROPPED_OFF" ? timeAgo(assignment.lastStatusAt) : "En route"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={textStyles.muted}>No active trip</Text>
                )}
              </PressableCard>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="No children yet"
          message="Add a child with their school address to start assigning drivers."
        />
      )}

      <PressableCard onPress={() => router.push("/parent/kids/add")} style={styles.addCard}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kidName}>Add a child</Text>
          <Text style={textStyles.muted}>Track journeys, get real-time updates and keep them safe.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </PressableCard>

      <PromoCard
        icon="shield-checkmark-outline"
        title="Safety first, always"
        body="We notify you at every step of their journey so you never miss an important update."
      />

      <Text style={styles.note}>School addresses are geocoded so drop-offs can be verified within 250 m.</Text>
    </Screen>
  );
}

function TripPanelItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.tripPanelItem}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <View>
        <Text style={styles.tripPanelLabel}>{label}</Text>
        <Text style={styles.tripPanelValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  title: { color: colors.ink, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },

  addChipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addChipText: { color: colors.primary, fontSize: 13, fontWeight: "800" },

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
  kidHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
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
  kidName: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  kidMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  gradePill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  gradePillText: { color: colors.primary, fontSize: 11, fontWeight: "700" },

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

  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  progressLabel: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 92 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotFilled: { backgroundColor: colors.success },
  progressText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  progressTime: { color: colors.muted, fontSize: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, position: "relative" },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.success },
  trackMarker: {
    position: "absolute",
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -10 }],
  },

  addCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderStyle: "dashed" },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  note: { color: colors.muted, fontSize: 12, paddingHorizontal: 4 },
});
