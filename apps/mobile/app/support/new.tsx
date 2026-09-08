import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/context";
import { AppButton, Card, FormField, Header, Screen, textStyles } from "../../src/components/ui";
import { useApiMutation } from "../../src/hooks/use-api-mutation";

export default function NewTicketScreen() {
  const router = useRouter();
  const { actor } = useAuth();
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const create = useApiMutation(
    () =>
      apiRequest<{ message: string }>("/api/support-tickets", {
        method: "POST",
        body: JSON.stringify({ message: message.trim() }),
      }),
    {
      invalidate: [["support-tickets"]],
      successMessage: (data) => data.message || "Support request sent.",
      onSuccess: () => router.back(),
    }
  );
  const tooShort = message.trim().length < 5;
  const tooLong = message.length > 2000;

  return (
    <Screen>
      <Header eyebrow="Help" title="New ticket" subtitle="Describe the issue. Mention who, where and when so we can act fast." />
      <Card>
        <Text style={textStyles.muted}>From</Text>
        <Text style={textStyles.cardTitle}>{actor?.name ?? "You"}</Text>
        <Text style={textStyles.muted}>{actor?.email}</Text>
      </Card>
      <FormField
        label="What happened?"
        placeholder="Tell support what happened"
        multiline
        maxLength={2000}
        value={message}
        onChangeText={setMessage}
        hint={`${message.length}/2000`}
        error={touched && tooShort ? "Please describe the issue (at least 5 characters)." : touched && tooLong ? "Keep it under 2,000 characters." : null}
      />
      <AppButton
        label={create.isPending ? "Sending…" : "Send to support"}
        disabled={create.isPending}
        onPress={() => {
          setTouched(true);
          if (!tooShort && !tooLong) create.mutate(undefined);
        }}
      />
    </Screen>
  );
}
