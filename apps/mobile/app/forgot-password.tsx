import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { ApiError, apiRequest } from "../src/api/client";
import { AuthButton, AuthField, AuthScreen, AuthSegment, authStyles } from "../src/components/auth-form";
import type { MobileRole } from "../src/types";

const roles: Array<{ value: MobileRole; label: string }> = [
  { value: "parent", label: "Parent" },
  { value: "driver", label: "Driver" },
  { value: "teacher", label: "Teacher" },
];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; email?: string }>();
  const [role, setRole] = useState<MobileRole>(
    roles.some((item) => item.value === params.role) ? (params.role as MobileRole) : "parent"
  );
  const [email, setEmail] = useState(params.email ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError("");
    try {
      const result = await apiRequest<{ message: string }>("/api/mobile/auth/reset", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      setDone(result.message);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : "Unable to send the reset link. Check your connection.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <AuthScreen title="Check your email" onBack={() => router.replace("/login")}>
        <Text style={authStyles.success}>{done}</Text>
        <Text style={authStyles.fine}>Open the link in the email to choose a new password, then sign in here.</Text>
        <AuthButton label="Back to Sign In" onPress={() => router.replace("/login")} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset password"
      subtitle="Tell us which account and we'll email you a secure link to choose a new password."
    >
      <AuthSegment<MobileRole> options={roles} value={role} onChange={(value) => setRole(value)} />
      <AuthField
        label="Email"
        placeholder="Email here"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={authStyles.error}>{error}</Text> : null}
      <AuthButton
        label={pending ? "Sending…" : "Send reset link"}
        disabled={pending || !email.includes("@")}
        onPress={() => void submit()}
      />
    </AuthScreen>
  );
}
