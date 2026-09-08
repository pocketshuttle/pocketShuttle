import { Alert, Text } from "react-native";

import { useAuth } from "../auth/context";
import { AppButton, Card, Header, Screen, StatusPill, textStyles } from "../components/ui";

export function ProfileScreen() {
  const { actor, signOut } = useAuth();
  if (!actor) return null;
  return (
    <Screen>
      <Header title="Profile" subtitle="Manage this device and session." />
      <Card>
        <Text style={textStyles.cardTitle}>{actor.name}</Text>
        <Text style={textStyles.body}>{actor.email}</Text>
        <StatusPill label={actor.role} />
      </Card>
      <Card>
        <Text style={textStyles.cardTitle}>Safety and privacy</Text>
        <Text style={textStyles.muted}>
          Driver background location is enabled only during an active trip and
          stops when the trip ends or you sign out.
        </Text>
      </Card>
      <AppButton
        variant="danger"
        label="Sign out"
        onPress={() =>
          Alert.alert("Sign out?", "Background tracking will stop immediately.", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: () => void signOut() },
          ])
        }
      />
    </Screen>
  );
}
