import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError } from "../src/api/client";
import { useAuth } from "../src/auth/context";
import {
  AuthButton,
  AuthField,
  AuthScreen,
  AuthSegment,
  authColors,
  authStyles,
} from "../src/components/auth-form";
import { getJson, removeKey, setJson } from "../src/services/kv";
import type { MobileRole } from "../src/types";

const roles: Array<{ value: MobileRole; label: string }> = [
  { value: "parent", label: "Parent" },
  { value: "driver", label: "Driver" },
  { value: "teacher", label: "Teacher" },
];

const REMEMBER_KEY = "pocketshuttle.mobile.remembered-login";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<MobileRole>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void getJson<{ email: string; role: MobileRole } | null>(REMEMBER_KEY, null).then((saved) => {
      if (saved?.email) {
        setEmail(saved.email);
        setRole(saved.role ?? "parent");
        setRemember(true);
      }
    });
  }, []);

  const submit = async () => {
    setPending(true);
    setError("");
    try {
      await signIn({ email: email.trim(), password, role });
      if (remember) await setJson(REMEMBER_KEY, { email: email.trim(), role });
      else await removeKey(REMEMBER_KEY);
      router.replace(`/${role}`);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : "Unable to sign in. Check your connection.");
    } finally {
      setPending(false);
    }
  };

  const canSubmit = !pending && email.includes("@") && password.length > 0;

  return (
    <AuthScreen
      title="Sign In"
      subtitle="Log in to follow your child's journeys and manage your trusted drivers. New to PocketShuttle? Create an account below."
      footer={
        <>
          <Text style={authStyles.footer}>
            Haven't any account?{" "}
            <Text style={authStyles.link} onPress={() => router.push("/register")}>
              Sign Up
            </Text>
          </Text>
          <Text style={authStyles.fine}>
            Emergency visibility and critical alerts remain available on every PocketShuttle plan.
          </Text>
        </>
      }
    >
      <AuthSegment<MobileRole> options={roles} value={role} onChange={(value) => setRole(value)} />
      <AuthField
        label="Email"
        placeholder="Email here"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        label="Password"
        placeholder="Enter password"
        autoComplete="current-password"
        secure
        value={password}
        onChangeText={setPassword}
      />
      <View style={authStyles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember((value) => !value)}
          style={styles.rememberRow}
        >
          <View style={[styles.checkbox, remember && styles.checkboxOn]}>
            {remember ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: "/forgot-password", params: { role, email } })}>
          <Text style={authStyles.linkDanger}>Forgot password?</Text>
        </Pressable>
      </View>
      {error ? <Text style={authStyles.error}>{error}</Text> : null}
      <AuthButton label={pending ? "Signing in…" : "Log In"} disabled={!canSubmit} onPress={() => void submit()} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: authColors.muted,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: authColors.primary, borderColor: authColors.primary },
  rememberText: { color: authColors.ink, fontSize: 13 },
});
