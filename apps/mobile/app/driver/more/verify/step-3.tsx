import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { apiRequest } from "../../../../src/api/client";
import { DocumentPicker } from "../../../../src/components/document-picker";
import { AppButton, Card, Header, LoadingState, Screen, textStyles } from "../../../../src/components/ui";
import { queryKeys } from "../../../../src/hooks/marketplace";
import { useApiMutation } from "../../../../src/hooks/use-api-mutation";
import { documentPurposes, useVerificationDraft } from "../../../../src/stores/verification-draft";

export default function VerifyStepThree() {
  const router = useRouter();
  const { draft, loaded, setDocument, clear } = useVerificationDraft();
  const [touched, setTouched] = useState(false);

  const submit = useApiMutation(
    () =>
      apiRequest<{ message: string }>("/api/driver/verification", {
        method: "PATCH",
        body: JSON.stringify({
          image: draft.documents.image,
          phoneNumber: draft.phoneNumber.trim(),
          address: draft.address.trim(),
          liveAddress: draft.liveAddress,
          landmark: draft.landmark.trim(),
          utilityBillUrl: draft.documents.utilityBillUrl,
          identityDocumentUrl: draft.documents.identityDocumentUrl,
          drivingLicenseUrl: draft.documents.drivingLicenseUrl,
          vehicleRegistrationUrl: draft.documents.vehicleRegistrationUrl,
          vehicleInsuranceUrl: draft.documents.vehicleInsuranceUrl,
        }),
      }),
    {
      invalidate: [queryKeys.dashboard],
      successMessage: (data) => data.message || "Documents submitted for review.",
      onSuccess: async () => {
        await clear();
        router.dismissAll();
        router.replace("/driver/more/verify");
      },
    }
  );

  if (!loaded) return <LoadingState label="Loading…" />;
  const ready = !!draft.documents.vehicleRegistrationUrl && !!draft.documents.vehicleInsuranceUrl;
  const missingEarlier = (["image", "utilityBillUrl", "identityDocumentUrl", "drivingLicenseUrl"] as const).filter((key) => !draft.documents[key]);

  return (
    <Screen>
      <Header eyebrow="Step 3 of 3" title="Vehicle documents" subtitle="Registration and insurance for the vehicle you drive." />
      <Card>
        <DocumentPicker
          label="Vehicle registration"
          hint="Vehicle licence / registration certificate."
          purpose={documentPurposes.vehicleRegistrationUrl}
          value={draft.documents.vehicleRegistrationUrl}
          preview={draft.previews.vehicleRegistrationUrl}
          onUploaded={(url, uri) => setDocument("vehicleRegistrationUrl", url, uri)}
        />
        <DocumentPicker
          label="Vehicle insurance"
          hint="Current insurance certificate."
          purpose={documentPurposes.vehicleInsuranceUrl}
          value={draft.documents.vehicleInsuranceUrl}
          preview={draft.previews.vehicleInsuranceUrl}
          onUploaded={(url, uri) => setDocument("vehicleInsuranceUrl", url, uri)}
        />
        {touched && !ready ? <Text style={{ color: "#DC2626", fontSize: 13 }}>Add both vehicle documents to submit.</Text> : null}
        {touched && missingEarlier.length ? (
          <Text style={{ color: "#DC2626", fontSize: 13 }}>Some earlier documents are missing — go back and add them.</Text>
        ) : null}
        <Text style={textStyles.muted}>By submitting you confirm these documents are genuine and belong to you.</Text>
      </Card>
      <AppButton
        label={submit.isPending ? "Submitting…" : "Submit for review"}
        variant="success"
        disabled={submit.isPending}
        onPress={() => {
          setTouched(true);
          if (ready && !missingEarlier.length && draft.liveAddress) submit.mutate(undefined);
        }}
      />
      <AppButton label="Back" variant="outline" onPress={() => router.back()} />
    </Screen>
  );
}
