import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { apiRequest } from "../../src/api/client";
import { AuthButton, AuthField, AuthScreen, authStyles } from "../../src/components/auth-form";
import { useToast } from "../../src/components/toast";
import { useApiMutation } from "../../src/hooks/use-api-mutation";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [touched, setTouched] = useState(false);

  const change = useApiMutation(
    () =>
      apiRequest<{ message: string }>("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      }),
    {
      onSuccess: (data) => {
        toast.show(data.message, { variant: "success" });
        router.back();
      },
    }
  );

  const tooShort = next.length < 6;
  const mismatch = confirmValue !== next;
  const same = next.length > 0 && next === current;

  return (
    <AuthScreen title="Change password" subtitle="Choose a new password with at least 6 characters." onBack={() => router.back()}>
      <AuthField label="Current password" placeholder="Your current password" secure autoComplete="current-password" value={current} onChangeText={setCurrent} />
      <AuthField
        label="New password"
        placeholder="At least 6 characters"
        secure
        autoComplete="new-password"
        value={next}
        onChangeText={setNext}
        error={touched && tooShort ? "At least 6 characters." : touched && same ? "Choose a different password." : null}
      />
      <AuthField label="Confirm new password" placeholder="Repeat the new password" secure value={confirmValue} onChangeText={setConfirmValue} error={touched && mismatch ? "Passwords do not match." : null} />
      <AuthButton
        label={change.isPending ? "Updating…" : "Update password"}
        disabled={change.isPending || !current}
        onPress={() => {
          setTouched(true);
          if (!tooShort && !mismatch && !same) change.mutate(undefined);
        }}
      />
      <Text style={authStyles.fine}>Changing your password signs out other devices using this account.</Text>
    </AuthScreen>
  );
}
