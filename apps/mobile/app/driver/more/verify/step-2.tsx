import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { DocumentPicker } from "../../../../src/components/document-picker";
import { AppButton, Card, Header, LoadingState, Screen, textStyles } from "../../../../src/components/ui";
import { documentPurposes, useVerificationDraft } from "../../../../src/stores/verification-draft";

export default function VerifyStepTwo() {
  const router = useRouter();
  const { draft, loaded, setDocument } = useVerificationDraft();
  const [touched, setTouched] = useState(false);
  if (!loaded) return <LoadingState label="Loading…" />;
  const ready = !!draft.documents.drivingLicenseUrl;

  return (
    <Screen>
      <Header eyebrow="Step 2 of 3" title="Driving licence" subtitle="Your valid FRSC driving licence." />
      <Card>
        <DocumentPicker
          label="Driving licence"
          hint="Front of the card, all four corners visible, not expired."
          purpose={documentPurposes.drivingLicenseUrl}
          value={draft.documents.drivingLicenseUrl}
          preview={draft.previews.drivingLicenseUrl}
          onUploaded={(url, uri) => setDocument("drivingLicenseUrl", url, uri)}
        />
        {touched && !ready ? <Text style={{ color: "#DC2626", fontSize: 13 }}>Add your driving licence to continue.</Text> : null}
        <Text style={textStyles.muted}>We verify licence numbers with the issuing authority.</Text>
      </Card>
      <AppButton
        label="Continue to vehicle"
        onPress={() => {
          setTouched(true);
          if (ready) router.push("/driver/more/verify/step-3");
        }}
      />
      <AppButton label="Back" variant="outline" onPress={() => router.back()} />
    </Screen>
  );
}
