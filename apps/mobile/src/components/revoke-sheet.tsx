import { useState } from "react";
import { Text } from "react-native";

import { apiRequest } from "../api/client";
import { useApiMutation } from "../hooks/use-api-mutation";
import { queryKeys } from "../hooks/marketplace";
import { BottomSheet } from "./bottom-sheet";
import { AppButton, FormField, textStyles } from "./ui";

/** Parent-side "Revoke driver access" flow: reason ≥ 5 characters, cascades assignments server-side. */
export function RevokeSheet({
  connectionId,
  driverName,
  onClose,
}: {
  connectionId: string | null;
  driverName?: string | null;
  onClose(): void;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const revoke = useApiMutation(
    (vars: { id: string; reason: string }) =>
      apiRequest<{ message: string }>(`/api/parent-driver-connections/${vars.id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason: vars.reason }),
      }),
    {
      invalidate: [queryKeys.parentConnections, queryKeys.dashboard, queryKeys.knownDriverEvents],
      successMessage: "Driver access revoked.",
      onSuccess: () => {
        setReason("");
        setTouched(false);
        onClose();
      },
    }
  );
  const tooShort = reason.trim().length < 5;

  return (
    <BottomSheet visible={connectionId !== null} onClose={onClose} title="Revoke driver access">
      <Text style={textStyles.body}>
        {driverName || "This driver"} will lose access to your children immediately. Tell us why so we
        can keep the network safe.
      </Text>
      <FormField
        label="Reason"
        placeholder="At least 5 characters"
        value={reason}
        onChangeText={(value) => {
          setReason(value);
          setTouched(true);
        }}
        multiline
        error={touched && tooShort ? "Reason must be at least 5 characters." : null}
      />
      <AppButton
        label={revoke.isPending ? "Revoking…" : "Revoke access"}
        variant="danger"
        disabled={tooShort || revoke.isPending}
        onPress={() => {
          setTouched(true);
          if (!tooShort && connectionId) revoke.mutate({ id: connectionId, reason: reason.trim() });
        }}
      />
      <AppButton label="Cancel" variant="outline" onPress={onClose} />
    </BottomSheet>
  );
}
