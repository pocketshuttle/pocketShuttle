import { useQueryClient } from "@tanstack/react-query";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import {
  AppButton,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  StatusPill,
  textStyles,
} from "../../src/components/ui";
import { TripMap } from "../../src/components/trip-map";
import { useDashboard } from "../../src/hooks/use-dashboard";
import { sendOrQueueMobileEvent } from "../../src/services/offline-queue";

export default function TeacherHome() {
  const query = useDashboard("teacher");
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (query.isLoading) return <LoadingState label="Loading students…" />;
  if (!query.data) {
    return (
      <Screen>
        <Header title="Teacher" />
        <EmptyState title="Unable to load" message="Check your connection." />
      </Screen>
    );
  }
  const trip = query.data.trips.active[0];
  const updateStudent = async (
    id: string,
    field: "attendance" | "status",
    value: string
  ) => {
    setPendingId(id);
    try {
      await sendOrQueueMobileEvent({
        path: `/api/mobile/students/${id}/state`,
        method: "PATCH",
        body: { field, value },
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
    } catch (error) {
      Alert.alert(
        "Student update failed",
        error instanceof Error ? error.message : "Try again."
      );
    } finally {
      setPendingId(null);
    }
  };
  return (
    <Screen>
      <Header
        eyebrow="Teacher operations"
        title={`Hello, ${query.data.profile.name.split(" ")[0]}`}
        subtitle="Attendance and pickup/drop-off changes are timestamped and synced."
      />
      {trip ? (
        <>
          <View style={styles.row}>
            <Text style={textStyles.cardTitle}>{trip.title}</Text>
            <StatusPill
              label={trip.status}
              danger={trip.status === "emergency"}
            />
          </View>
          <TripMap location={trip.locations[0]} />
        </>
      ) : (
        <EmptyState
          title="No active trip"
          message="Your assigned route appears here when operations begin."
        />
      )}
      <Text style={textStyles.cardTitle}>Assigned students</Text>
      <View style={styles.list}>
        {query.data.students.map((student) => (
          <Card key={student.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={textStyles.cardTitle}>
                  {student.full_name || "Student"}
                </Text>
                <Text style={textStyles.muted}>
                  {student.grade || "Grade not set"} ·{" "}
                  {student.attendance || "ABSENT"}
                </Text>
              </View>
              <StatusPill label={student.status || "DROPPED"} />
            </View>
            <View style={styles.actions}>
              <AppButton
                variant="outline"
                label="Present"
                disabled={pendingId === student.id}
                onPress={() =>
                  void updateStudent(student.id, "attendance", "PRESENT")
                }
              />
              <AppButton
                variant="outline"
                label="Absent"
                disabled={pendingId === student.id}
                onPress={() =>
                  void updateStudent(student.id, "attendance", "ABSENT")
                }
              />
              <AppButton
                label="Picked up"
                disabled={pendingId === student.id}
                onPress={() =>
                  void updateStudent(student.id, "status", "PICKED")
                }
              />
              <AppButton
                variant="success"
                label="Dropped off"
                disabled={pendingId === student.id}
                onPress={() =>
                  void updateStudent(student.id, "status", "DROPPED")
                }
              />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  actions: { gap: 8 },
});
