import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";

import { DocumentPicker } from "../../../../src/components/document-picker";
import { AppButton, Card, FormField, Header, LoadingState, Screen, textStyles } from "../../../../src/components/ui";
import { useDashboard } from "../../../../src/hooks/use-dashboard";
import { E164_PATTERN } from "../../../../src/lib/child-place-label";
import { documentPurposes, useVerificationDraft } from "../../../../src/stores/verification-draft";

export default function VerifyStepOne() {
  const router = useRouter();
  const dashboard = useDashboard("driver");
  const { draft, loaded, update, setDocument } = useVerificationDraft();
  const [touched, setTouched] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!loaded || !dashboard.data?.driver) return;
    const driver = dashboard.data.driver;
    if (!draft.phoneNumber && driver.phoneNumber) update({ phoneNumber: driver.phoneNumber });
    if (!draft.address && driver.address) update({ address: driver.address });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, dashboard.data?.driver?.id]);

  if (!loaded) return <LoadingState label="Loading…" />;

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Location permission is required.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      update({ liveAddress: { latitude: position.coords.latitude, longitude: position.coords.longitude } });
    } catch (error) {
      Alert.alert("Location", error instanceof Error ? error.message : "Unable to read your location.");
    } finally {
      setLocating(false);
    }
  };

  const errors = {
    phoneNumber: !E164_PATTERN.test(draft.phoneNumber.trim()) ? "Use the format +2348012345678." : null,
    address: draft.address.trim().length < 5 ? "Enter your home address." : null,
    landmark: draft.landmark.trim().length < 2 ? "Add a nearby landmark." : null,
  };
  const missingDocs = (["image", "utilityBillUrl", "identityDocumentUrl"] as const).filter((key) => !draft.documents[key]);
  const valid = !errors.phoneNumber && !errors.address && !errors.landmark && draft.liveAddress && missingDocs.length === 0;

  return (
    <Screen>
      <Header eyebrow="Step 1 of 3" title="Identity" subtitle="Who you are and where you live." />
      <Card>
        <DocumentPicker
          label="Profile photo"
          hint="A clear photo of your face. Parents see this on your profile."
          purpose={documentPurposes.image}
          value={draft.documents.image}
          preview={draft.previews.image}
          onUploaded={(url, uri) => setDocument("image", url, uri)}
        />
        <FormField label="Phone number" placeholder="+2348012345678" keyboardType="phone-pad" value={draft.phoneNumber} onChangeText={(phoneNumber) => update({ phoneNumber })} error={touched ? errors.phoneNumber : null} />
        <FormField label="Home address" placeholder="Street, area, city" value={draft.address} onChangeText={(address) => update({ address })} error={touched ? errors.address : null} />
        <FormField label="Nearest landmark" placeholder="e.g. opposite Ikeja City Mall" value={draft.landmark} onChangeText={(landmark) => update({ landmark })} error={touched ? errors.landmark : null} />
        <Text style={textStyles.muted}>
          {draft.liveAddress
            ? `Location captured: ${draft.liveAddress.latitude.toFixed(5)}, ${draft.liveAddress.longitude.toFixed(5)}`
            : "We record your current location once to confirm your address."}
        </Text>
        <AppButton
          label={locating ? "Locating…" : draft.liveAddress ? "Update current location" : "Use current location"}
          variant="outline"
          disabled={locating}
          onPress={() => void useCurrentLocation()}
        />
        {touched && !draft.liveAddress ? <Text style={styles.error}>Capture your current location to continue.</Text> : null}
      </Card>
      <Card>
        <DocumentPicker
          label="Utility bill"
          hint="Recent electricity, water or waste bill showing your address."
          purpose={documentPurposes.utilityBillUrl}
          value={draft.documents.utilityBillUrl}
          preview={draft.previews.utilityBillUrl}
          onUploaded={(url, uri) => setDocument("utilityBillUrl", url, uri)}
        />
        <DocumentPicker
          label="Passport page or NIN card"
          hint="Government ID with your photo and name."
          purpose={documentPurposes.identityDocumentUrl}
          value={draft.documents.identityDocumentUrl}
          preview={draft.previews.identityDocumentUrl}
          onUploaded={(url, uri) => setDocument("identityDocumentUrl", url, uri)}
        />
        {touched && missingDocs.length ? <Text style={styles.error}>Add all documents above to continue.</Text> : null}
      </Card>
      <AppButton
        label="Continue to licence"
        onPress={() => {
          setTouched(true);
          if (valid) router.push("/driver/more/verify/step-2");
        }}
      />
    </Screen>
  );
}

const styles = { error: { color: "#DC2626", fontSize: 13, lineHeight: 18 } } as const;
