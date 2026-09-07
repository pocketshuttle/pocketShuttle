import { useCallback, useEffect, useState } from "react";

import { getJson, removeKey, setJson } from "../services/kv";

export type DocumentKey =
  | "image"
  | "utilityBillUrl"
  | "identityDocumentUrl"
  | "drivingLicenseUrl"
  | "vehicleRegistrationUrl"
  | "vehicleInsuranceUrl";

export const documentPurposes: Record<DocumentKey, string> = {
  image: "driver-avatar",
  utilityBillUrl: "driver-utility-bill",
  identityDocumentUrl: "driver-identity-document",
  drivingLicenseUrl: "driver-driving-license",
  vehicleRegistrationUrl: "driver-vehicle-registration",
  vehicleInsuranceUrl: "driver-vehicle-insurance",
};

export type VerificationDraft = {
  phoneNumber: string;
  address: string;
  landmark: string;
  liveAddress: { latitude: number; longitude: number } | null;
  documents: Partial<Record<DocumentKey, string>>;
  previews: Partial<Record<DocumentKey, string>>;
};

const KEY = "pocketshuttle.mobile.verification-draft";

export const emptyDraft: VerificationDraft = {
  phoneNumber: "",
  address: "",
  landmark: "",
  liveAddress: null,
  documents: {},
  previews: {},
};

export function useVerificationDraft() {
  const [draft, setDraft] = useState<VerificationDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void getJson<VerificationDraft>(KEY, emptyDraft).then((saved) => {
      setDraft({ ...emptyDraft, ...saved, documents: saved.documents ?? {}, previews: saved.previews ?? {} });
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<VerificationDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      void setJson(KEY, next);
      return next;
    });
  }, []);

  const setDocument = useCallback(
    (key: DocumentKey, url: string, preview: string) => {
      setDraft((current) => {
        const next = {
          ...current,
          documents: { ...current.documents, [key]: url },
          previews: { ...current.previews, [key]: preview },
        };
        void setJson(KEY, next);
        return next;
      });
    },
    []
  );

  const clear = useCallback(async () => {
    setDraft(emptyDraft);
    await removeKey(KEY);
  }, []);

  return { draft, loaded, update, setDocument, clear };
}
