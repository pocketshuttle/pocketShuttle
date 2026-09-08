import { useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { AssignmentStatusControls } from "../../../src/components/assignment-status-controls";
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
import { useConnections } from "../../../src/hooks/marketplace";
import { childPlaceLabel, humanizeStatus, mapsUrl, timeAgo } from "../../../src/lib/child-place-label";

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const connections = useConnections("driver");
  const connection = connections.data?.find((item) => item.id === id);

  if (connections.isLoading) return <LoadingState label="Loading family…" />;
  if (!connection) {
    return (
      <Screen>
        <Header title="Family" />
        <EmptyState title="Not found" message="This family is no longer connected." />
      </Screen>
    );
  }

  const places = connection.customPlaces ?? [];
  const templates = connection.tripTemplates ?? [];

  return (
    <Screen>
      <Header
        eyebrow={humanizeStatus(connection.status)}
        title={connection.parent.full_name || "Parent"}
        subtitle={connection.parent.phoneNumber || undefined}
      />
      {connection.parent.phoneNumber ? (
        <AppButton
          label="Call parent"
          variant="outline"
          onPress={() => Linking.openURL(`tel:${connection.parent.phoneNumber}`)}
        />
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
                    {[assignment.child.grade, assignment.child.address || "No school address"]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <StatusPill label={childPlaceLabel(assignment)} />
              </View>
              <Text style={textStyles.muted}>
                Last status {timeAgo(assignment.lastStatusAt)} · {humanizeStatus(assignment.status)}
              </Text>
              <AssignmentStatusControls assignmentId={assignment.id} lastStatus={assignment.lastStatus} />
            </Card>
          ))}
        </View>
      ) : (
        <Text style={textStyles.muted}>
          {connection.status === "PARENT_APPROVED"
            ? "The parent hasn't assigned any children yet."
            : "Children appear after the parent approves you."}
        </Text>
      )}

      <SectionTitle>Saved places</SectionTitle>
      {places.length ? (
        <Card>
          {places.map((place) => (
            <ListRow
              key={place.id}
              icon="location-outline"
              title={place.name}
              subtitle={`${place.radiusMeters} m radius`}
              right={
                <AppButton
                  label="Map"
                  variant="outline"
                  onPress={() => Linking.openURL(mapsUrl(place.latitude, place.longitude))}
                />
              }
            />
          ))}
        </Card>
      ) : (
        <Text style={textStyles.muted}>No saved places shared by this family.</Text>
      )}

      <SectionTitle>Recurring trips</SectionTitle>
      {templates.length ? (
        <Card>
          {templates.map((template) => (
            <ListRow
              key={template.id}
              icon="calendar-outline"
              title={template.title}
              subtitle={[
                template.schedule?.frequency ? humanizeStatus(template.schedule.frequency) : "Scheduled",
                template.nextRunAt ? `Next ${new Date(template.nextRunAt).toLocaleString()}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </Card>
      ) : (
        <Text style={textStyles.muted}>No recurring trips set up by this family.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
});
