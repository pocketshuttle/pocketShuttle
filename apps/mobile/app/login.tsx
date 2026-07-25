import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_URL, ApiError } from "../src/api/client";
import { useAuth } from "../src/auth/context";
import { AppButton, Card, Header, Screen, textStyles } from "../src/components/ui";
import { colors } from "../src/theme";
import type { MobileRole } from "../src/types";

const roles: Array<{ value: MobileRole; label: string }> = [
  { value: "parent", label: "Parent" },
  { value: "driver", label: "Driver" },
  { value: "teacher", label: "Teacher" },
];

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<MobileRole>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError("");
    try {
      await signIn({ email, password, role });
      router.replace(`/${role}`);
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : "Unable to sign in. Check your connection."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View style={styles.brand}>
          <Text style={styles.logo}>PS</Text>
        </View>
        <Header
          eyebrow="PocketShuttle"
          title="Travel safely together"
          subtitle="Sign in as a parent, driver, or teacher."
        />
        <Card>
          <View style={styles.roles}>
            {roles.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRole(item.value)}
                style={[
                  styles.role,
                  role === item.value && styles.roleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === item.value && styles.roleTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="current-password"
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label={pending ? "Signing in…" : "Sign in"}
            disabled={pending || !email.includes("@") || !password}
            onPress={() => void submit()}
          />
          <Pressable onPress={() => void Linking.openURL(`${API_URL}/reset`)}>
            <Text style={[textStyles.body, styles.reset]}>
              Forgot your password?
            </Text>
          </Pressable>
        </Card>
        <Text style={textStyles.muted}>
          Emergency visibility and critical alerts remain available on every
          PocketShuttle plan.
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 28,
  },
  logo: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  roles: { flexDirection: "row", gap: 8 },
  role: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingVertical: 10,
  },
  roleSelected: { backgroundColor: colors.primary },
  roleText: { color: colors.muted, fontWeight: "700" },
  roleTextSelected: { color: "#FFFFFF" },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  reset: { color: colors.primary, textAlign: "center", fontWeight: "700" },
});
