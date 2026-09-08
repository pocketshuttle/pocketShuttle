import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  Card,
  EmptyState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  textStyles,
} from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { useParentChildren } from "../../../src/hooks/marketplace";
import { useDashboard } from "../../../src/hooks/use-dashboard";

export default function KidsScreen() {
  const router = useRouter();
  const children = useParentChildren();
  const dashboard = useDashboard("parent");
  const limits = dashboard.data?.limits;
  const limitReached =
    !!limits &&
    limits.enforcementEnabled &&
    limits.maxChildren !== null &&
    (children.data?.length ?? limits.childCount) >= limits.maxChildren;

  if (children.isLoading) return <LoadingState label="Loading children…" />;

  return (
    <Screen>
      <Header
        eyebrow="Family"
        title="Kids"
        subtitle={
          limits
            ? `${children.data?.length ?? 0} of ${limits.maxChildren ?? "unlimited"} on your ${limits.planName} plan.`
            : "Manage the children you track."
        }
      />
      {limitReached ? (
        <UpgradePrompt compact feature="max_children" requiredPlan="PRO_FAMILY" />
      ) : (
        <AppButton label="Add a child" onPress={() => router.push("/parent/kids/add")} />
      )}
      {children.data?.length ? (
        <Card>
          {children.data.map((child) => (
            <ListRow
              key={child.id}
              icon="person-outline"
              title={child.fullName}
              subtitle={[
                child.grade || null,
                child.address || "No school address",
                child.activeDriver?.full_name ? `Driver: ${child.activeDriver.full_name}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => router.push({ pathname: "/parent/kids/[id]", params: { id: child.id } })}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="No children yet"
          message="Add a child with their school address to start assigning drivers."
        />
      )}
      <View style={styles.note}>
        <Text style={textStyles.muted}>
          School addresses are geocoded so drop-offs can be verified within 250 m.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ note: { paddingHorizontal: 4 } });
