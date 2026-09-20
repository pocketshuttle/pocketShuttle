import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Animated,
  Linking,
  Pressable,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { apiRequest } from "../../src/api/client";
import { TripMap } from "../../src/components/trip-map";
import {
  AppButton,
  Avatar,
  Card,
  EmptyState,
  IconButton,
  IconName,
  LoadingState,
  PromoCard,
  Screen,
  ViewAllLink,
  StatusPill,
  textStyles,
} from "../../src/components/ui";
import { queryKeys } from "../../src/hooks/marketplace";
import { useApiMutation } from "../../src/hooks/use-api-mutation";
import { useDashboard } from "../../src/hooks/use-dashboard";
import { useUnreadAlertsCount } from "../../src/hooks/use-unread-alerts";
import { childPlaceLabel, timeAgo } from "../../src/lib/child-place-label";
import { usePressScale } from "../../src/lib/motion";
import { colors, gradients, radius, spacing } from "../../src/theme";

/** Vertical icon-over-label tile used in the quick actions grid and the "add child" slot. */
function Tile({
  icon,
  label,
  tint,
  tintSoft,
  onPress,
  dashed,
  wrapStyle,
}: {
  icon: IconName;
  label: string;
  tint?: string;
  tintSoft?: string;
  onPress(): void;
  dashed?: boolean;
  wrapStyle?: StyleProp<ViewStyle>;
}) {
  const press = usePressScale();
  return (
    <Animated.View style={[press.style, styles.tileWrap, wrapStyle]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.tile, dashed && styles.tileDashed]}
      >
        <View style={[styles.tileIcon, { backgroundColor: tintSoft ?? colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={tint ?? colors.primary} />
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions: Array<{
  key: string;
  icon: IconName;
  label: string;
  tint: string;
  tintSoft: string;
}> = [
    { key: "find-driver", icon: "person-add-outline", label: "Find a driver", tint: colors.primary, tintSoft: colors.primarySoft },
    { key: "share-invite", icon: "share-social-outline", label: "Share invite", tint: colors.success, tintSoft: colors.successSoft },
    { key: "trip-history", icon: "map-outline", label: "Trip history", tint: colors.accentBlue, tintSoft: colors.accentBlueSoft },
    { key: "help-center", icon: "help-buoy-outline", label: "Help center", tint: colors.accentOrange, tintSoft: colors.accentOrangeSoft },
  ];

export default function ParentHome() {
  const router = useRouter();
  const query = useDashboard("parent");
  const unreadAlerts = useUnreadAlertsCount("parent");
  const requestLocation = useApiMutation(
    (assignmentId: string) =>
      apiRequest<{ message: string }>(
        `/api/child-driver-assignments/${assignmentId}/location-request`,
        { method: "POST" }
      ),
    {
      invalidate: [queryKeys.knownDriverEvents],
      successMessage: "Location request sent to the driver.",
    }
  );

  if (query.isLoading) return <LoadingState label="Loading your family…" />;
  if (!query.data) {
    return (
      <Screen>
        <EmptyState title="Unable to load" message="Check your connection and try again." />
      </Screen>
    );
  }

  const { limits, assignments, children, trips, profile } = query.data;
  const activeTrip = trips.active[0];
  const isFree = limits.planCode === "FREE_FAMILY";
  const childSeatsLeft = limits.maxChildren === null ? null : Math.max(0, limits.maxChildren - limits.childCount);
  const driverSeatsLeft =
    limits.maxConnectedDrivers === null ? null : Math.max(0, limits.maxConnectedDrivers - limits.driverCount);

  const runQuickAction = (key: string) => {
    if (key === "find-driver") router.push("/parent/drivers/add");
    else if (key === "trip-history") router.push("/parent/trips");
    else if (key === "help-center") router.push("/support");
    else if (key === "share-invite") {
      void Share.share({
        message: `Follow your child's journey and ride only with drivers you trust — join me on PocketShuttle. https://app.pocketshuttle.com`,
      });
    }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Avatar uri={profile.image} name={profile.name} size={52} />
          <View>
            <Text style={textStyles.muted}>{greeting()},</Text>
            <Text style={styles.greetingName}>
              {profile.name.split(" ")[0]} <Text>👋</Text>
            </Text>
            <Text style={textStyles.muted}>Here's what's happening today</Text>
          </View>
        </View>
        <IconButton
          icon="notifications-outline"
          badge={unreadAlerts > 0}
          onPress={() => router.push("/parent/more/notifications")}
        />
      </View>

      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planCard}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planLabel}>Your plan</Text>
          <View style={styles.planPill}>
            <Text style={styles.planPillEmoji}>👑</Text>
            <Text style={styles.planPillText}>{limits.planName.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.planStatsRow}>
          <View style={styles.planStat}>
            <View style={[styles.planStatIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <View style={styles.planStatText}>
              <Text style={styles.planStatValue}>
                {limits.childCount}/{limits.maxChildren ?? "∞"}
              </Text>
              <Text style={textStyles.muted} numberOfLines={1}>Children</Text>
              {childSeatsLeft !== null ? (
                <Text style={styles.planStatHint}>
                  {childSeatsLeft} seat{childSeatsLeft === 1 ? "" : "s"} remaining
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.planStat}>
            <View style={[styles.planStatIcon, { backgroundColor: colors.accentOrangeSoft }]}>
              <MaterialCommunityIcons name="steering" size={26} color={colors.accentOrange} />
            </View>
            <View style={styles.planStatText}>
              <Text style={styles.planStatValue}>
                {limits.driverCount}/{limits.maxConnectedDrivers ?? "∞"}
              </Text>
              <Text style={textStyles.muted} numberOfLines={1}>Drivers</Text>
              {driverSeatsLeft !== null ? (
                <Text style={styles.planStatHint}>
                  {driverSeatsLeft} seat{driverSeatsLeft === 1 ? "" : "s"} remaining
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {isFree ? (
          <View style={styles.upgradeBanner}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="diamond" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro Family</Text>
              <Text style={styles.upgradeBody}>
                Add more children, connect more drivers, and unlock premium safety features.
              </Text>
            </View>
            <AppButton label="View plans" onPress={() => router.push("/parent/more/billing")} />
          </View>
        ) : null}
      </LinearGradient>

      {activeTrip ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{activeTrip.title}</Text>
            <StatusPill label={activeTrip.status} danger={activeTrip.status === "emergency"} />
          </View>
          <TripMap location={activeTrip.locations[0]} />
        </>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Your kids</Text>
        <ViewAllLink onPress={() => router.push("/parent/kids")} />
      </View>
      <View style={styles.kidsRow}>
        {children.map((child) => (
          <View key={child.id} style={styles.kidCard}>
            <Avatar
              uri={child.image}
              name={child.name}
              size={48}
              badge={
                <View style={styles.kidBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
                </View>
              }
            />
            <Text style={styles.kidName} numberOfLines={1}>
              {child.name}
            </Text>
            {child.grade ? (
              <View style={styles.kidPill}>
                <Text style={styles.kidPillText}>{child.grade}</Text>
              </View>
            ) : null}
            <Text style={styles.kidStatus}>No active trip</Text>
          </View>
        ))}
        <Tile
          icon="add"
          label="Add child"
          dashed
          wrapStyle={styles.kidTile}
          onPress={() => router.push("/parent/kids/add")}
        />
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Your drivers</Text>
        <ViewAllLink onPress={() => router.push("/parent/drivers")} />
      </View>
      {assignments.length ? (
        <View style={styles.list}>
          {assignments.map((assignment) => {
            const live = assignment.driver.liveAddress;
            const hasLive =
              typeof live?.latitude === "number" && typeof live?.longitude === "number";
            return (
              <Card key={assignment.id}>
                <View style={styles.row}>
                  <Avatar uri={assignment.driver.image} name={assignment.driver.full_name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={textStyles.cardTitle}>{assignment.driver.full_name}</Text>
                    <Text style={textStyles.muted}>
                      {assignment.child.fullName}
                      {assignment.driver.plateNumber ? ` · ${assignment.driver.plateNumber}` : ""}
                    </Text>
                  </View>
                  <StatusPill label={childPlaceLabel(assignment)} />
                </View>
                <Text style={textStyles.muted}>
                  Last update {timeAgo(assignment.lastStatusAt)} · Driver active{" "}
                  {timeAgo(assignment.driver.lastActiveAt)}
                </Text>
                <View style={styles.actions}>
                  <AppButton
                    label={hasLive ? "View on map" : "No location yet"}
                    variant="outline"
                    disabled={!hasLive}
                    onPress={() =>
                      router.push({
                        pathname: "/parent/drivers/map",
                        params: { driverId: assignment.driver.id },
                      })
                    }
                  />
                  <AppButton
                    label={requestLocation.isPending ? "Requesting…" : "Request location"}
                    variant="outline"
                    disabled={requestLocation.isPending}
                    onPress={() => requestLocation.mutate(assignment.id)}
                  />
                  {assignment.driver.phoneNumber ? (
                    <AppButton
                      label="Call driver"
                      variant="outline"
                      onPress={() => Linking.openURL(`tel:${assignment.driver.phoneNumber}`)}
                    />
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card style={styles.noDrivers}>
          <View style={styles.noDriversIcon}>
            <MaterialCommunityIcons name="steering" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1, padding: 2, gap:3 }}>
            <Text style={textStyles.cardTitle}>No connected drivers yet</Text>
            <Text style={textStyles.muted}>
              Find a verified driver by share ID, email or phone, then assign your children.
            </Text>
            <AppButton
              label="Find a driver"
              icon="person-add-outline"
              onPress={() => router.push("/parent/drivers/add")}
            />
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <Tile
            key={action.key}
            icon={action.icon}
            label={action.label}
            tint={action.tint}
            tintSoft={action.tintSoft}
            wrapStyle={styles.quickTile}
            onPress={() => runQuickAction(action.key)}
          />
        ))}
      </View>

      <PromoCard
        icon="shield-checkmark-outline"
        title="Peace of mind, every day"
        body="Get real-time updates, trip alerts and safety notifications."
        actionLabel="Learn more"
        onPress={() => router.push("/support")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  greetingName: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },

  planCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planPillEmoji: { fontSize: 12 },
  planPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  planStatsRow: { flexDirection: "row", gap: spacing.md },
  planStat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  planStatIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planStatText: { flex: 1, minWidth: 0, gap: 1 },
  planStatValue: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  planStatHint: { color: colors.muted, fontSize: 11, marginTop: 1 },
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  upgradeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", marginBottom: 2 },
  upgradeBody: { color: colors.muted, fontSize: 12, lineHeight: 14 },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },

  kidsRow: { flexDirection: "row", gap: spacing.sm },
  kidCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    alignItems: "flex-start",
  },
  kidBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  kidName: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 4 },
  kidPill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  kidPillText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  kidStatus: { color: colors.muted, fontSize: 12 },
  kidTile: { flex: 1 },

  list: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actions: { gap: spacing.sm },
  noDrivers: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  noDriversIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickTile: { flexBasis: "47%", flexGrow: 1 },

  tileWrap: {},
  tile: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  tileDashed: { borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tileLabel: { color: colors.ink, fontSize: 13, fontWeight: "700" },

});
