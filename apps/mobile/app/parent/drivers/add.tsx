import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../../src/api/client";
import {
  AppButton,
  Card,
  Chips,
  EmptyState,
  FormField,
  Header,
  Screen,
  StatusPill,
  textStyles,
} from "../../../src/components/ui";
import { UpgradePrompt } from "../../../src/components/upgrade-prompt";
import { queryKeys, useDebouncedValue, useDriverSearch } from "../../../src/hooks/marketplace";
import { useApiMutation } from "../../../src/hooks/use-api-mutation";
import { E164_PATTERN, humanizeStatus } from "../../../src/lib/child-place-label";

type Mode = "search" | "invite";

export default function AddDriverScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const debounced = useDebouncedValue(query);
  const results = useDriverSearch(debounced);

  const request = useApiMutation(
    (driverId: string) =>
      apiRequest<{ message: string }>("/api/parent-driver-connections", {
        method: "POST",
        body: JSON.stringify({ driverId, note: note.trim() || undefined }),
      }),
    {
      invalidate: [queryKeys.parentConnections, queryKeys.dashboard, ["driver-search"]],
      successMessage: "Request sent to the driver.",
      onSuccess: () => router.back(),
    }
  );
  const invite = useApiMutation(
    (body: { email?: string; phoneNumber?: string }) =>
      apiRequest<{ message: string }>("/api/drivers/invites", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    {
      invalidate: [queryKeys.driverInvites, queryKeys.parentConnections],
      successMessage: (data) => data.message,
      onSuccess: () => router.back(),
    }
  );

  const phoneInvalid = phone.trim().length > 0 && !E164_PATTERN.test(phone.trim());
  const emailInvalid = email.trim().length > 0 && !/^\S+@\S+\.\S+$/.test(email.trim());
  const upgrade = request.upgrade ?? invite.upgrade;

  return (
    <Screen>
      <Header
        eyebrow="Known drivers"
        title="Find a driver"
        subtitle="Search a registered driver by share ID, email or phone, or invite one to join."
      />
      <Chips<Mode>
        options={[
          { value: "search", label: "Search drivers" },
          { value: "invite", label: "Invite by email / phone" },
        ]}
        value={mode}
        onChange={setMode}
      />
      {upgrade ? <UpgradePrompt feature={upgrade.feature} requiredPlan={upgrade.requiredPlan} /> : null}

      {mode === "search" ? (
        <>
          <FormField
            label="Share ID, email or phone"
            placeholder="e.g. PKD-AB12CD"
            autoCapitalize="none"
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
          />
          <FormField
            label="Note to the driver (optional)"
            placeholder="e.g. School run for Ada, weekdays 7am"
            value={note}
            onChangeText={setNote}
            multiline
          />
          {results.isFetching ? <Text style={textStyles.muted}>Searching…</Text> : null}
          {results.data?.map((driver) => {
            const existing = driver.existingConnection;
            const canRequest =
              !existing || ["REVOKED", "DECLINED"].includes(existing.status);
            return (
              <Card key={driver.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={textStyles.cardTitle}>{driver.full_name}</Text>
                    <Text style={textStyles.muted}>
                      {[driver.shareId, driver.vehicle, driver.vehicleCapacity ? `${driver.vehicleCapacity} seats` : null]
                        .filter(Boolean)
                        .join(" · ") || "Registered driver"}
                    </Text>
                  </View>
                  <StatusPill
                    label={humanizeStatus(driver.verificationStatus || "UNSUBMITTED")}
                    danger={driver.verificationStatus === "REJECTED"}
                  />
                </View>
                {existing && !canRequest ? (
                  <Text style={textStyles.muted}>
                    Already {humanizeStatus(existing.status).toLowerCase()} with you.
                  </Text>
                ) : (
                  <AppButton
                    label={request.isPending ? "Sending…" : existing ? "Request again" : "Request driver"}
                    disabled={request.isPending}
                    onPress={() => request.mutate(driver.id)}
                  />
                )}
              </Card>
            );
          })}
          {debounced.trim().length >= 2 && !results.isFetching && !results.data?.length ? (
            <EmptyState
              title="No drivers found"
              message="Check the share ID, or invite the driver to register with PocketShuttle."
            />
          ) : null}
        </>
      ) : (
        <Card>
          <Text style={textStyles.body}>
            We'll send a registration invite. If the driver already has an account, a connection
            request is created instead.
          </Text>
          <FormField
            label="Email"
            placeholder="driver@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={emailInvalid ? "Enter a valid email address." : invite.fieldErrors.email}
          />
          <FormField
            label="Phone (international format)"
            placeholder="+2348012345678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={phoneInvalid ? "Use the format +2348012345678." : invite.fieldErrors.phoneNumber}
          />
          <AppButton
            label={invite.isPending ? "Sending…" : "Send invite"}
            disabled={invite.isPending || phoneInvalid || emailInvalid || (!email.trim() && !phone.trim())}
            onPress={() =>
              invite.mutate({
                email: email.trim() || undefined,
                phoneNumber: phone.trim() || undefined,
              })
            }
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
});
