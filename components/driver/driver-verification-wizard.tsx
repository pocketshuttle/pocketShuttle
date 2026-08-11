"use client";

import Link from "next/link";
import { useState, useTransition, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Car,
  Check,
  Crosshair,
  FileBadge,
  IdCard,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Driver = {
  id: string;
  full_name: string;
  image?: string | null;
  phoneNumber?: string | null;
  address: string;
  liveAddress?: { latitude: number; longitude: number } | null;
  landmark?: string | null;
  utilityBillUrl?: string | null;
  identityDocumentUrl?: string | null;
  drivingLicenseUrl?: string | null;
  vehicleRegistrationUrl?: string | null;
  vehicleInsuranceUrl?: string | null;
  verificationStatus: string;
  verificationRejectionReason?: string | null;
};

type UploadField =
  | "image"
  | "utilityBillUrl"
  | "identityDocumentUrl"
  | "drivingLicenseUrl"
  | "vehicleRegistrationUrl"
  | "vehicleInsuranceUrl";

const UPLOAD_PURPOSES: Record<UploadField, string> = {
  image: "driver-avatar",
  utilityBillUrl: "driver-utility-bill",
  identityDocumentUrl: "driver-identity-document",
  drivingLicenseUrl: "driver-driving-license",
  vehicleRegistrationUrl: "driver-vehicle-registration",
  vehicleInsuranceUrl: "driver-vehicle-insurance",
};

const inputClass =
  "h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-none";

const steps = [
  { step: 1, label: "Personal" },
  { step: 2, label: "License" },
  { step: 3, label: "Vehicle" },
] as const;

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function UploadCard({
  label,
  hint,
  icon: Icon,
  url,
  uploading,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  icon: typeof Upload;
  url: string;
  uploading: boolean;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      {url ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-emerald-800">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label} uploaded
          </span>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900">
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {uploading ? "Uploading..." : "Change"}
            <input type="file" accept="image/*" className="sr-only" disabled={disabled || uploading} onChange={onChange} />
          </label>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-blue-700 shadow-sm">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <Icon className="h-6 w-6" aria-hidden="true" />}
          </span>
          <span className="text-sm font-semibold text-slate-800">
            {uploading ? "Uploading..." : `Upload ${label.toLowerCase()}`}
          </span>
          <span className="text-xs text-slate-500">{hint}</span>
          <input type="file" accept="image/*" className="sr-only" disabled={disabled || uploading} onChange={onChange} />
        </label>
      )}
    </div>
  );
}

export function DriverVerificationWizard({ driver }: { driver: Driver }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    image: driver.image || "",
    phoneNumber: driver.phoneNumber || "",
    address: driver.address || "",
    liveAddress: driver.liveAddress || (null as { latitude: number; longitude: number } | null),
    landmark: driver.landmark || "",
    utilityBillUrl: driver.utilityBillUrl || "",
    identityDocumentUrl: driver.identityDocumentUrl || "",
    drivingLicenseUrl: driver.drivingLicenseUrl || "",
    vehicleRegistrationUrl: driver.vehicleRegistrationUrl || "",
    vehicleInsuranceUrl: driver.vehicleInsuranceUrl || "",
  });
  const [verificationStatus, setVerificationStatus] = useState(driver.verificationStatus);
  const [uploadingField, setUploadingField] = useState<UploadField | null>(null);
  const [isPending, startTransition] = useTransition();

  const verified = verificationStatus === "VERIFIED";

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>, field: UploadField) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", UPLOAD_PURPOSES[field]);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Unable to upload file");
      setForm((current) => ({ ...current, [field]: data.url }));
      toast({ description: "File uploaded." });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({ description: "GPS is not available in this browser.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          liveAddress: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        }));
        toast({ description: "Location captured." });
      },
      () => toast({ description: "Unable to capture GPS location.", variant: "destructive" }),
      { enableHighAccuracy: true }
    );
  };

  const goToStep = (target: 1 | 2 | 3) => {
    if (target > step) {
      if (
        step === 1 &&
        (!form.image ||
          !form.phoneNumber.trim() ||
          !form.address.trim() ||
          !form.landmark.trim() ||
          !form.liveAddress ||
          !form.utilityBillUrl ||
          !form.identityDocumentUrl)
      ) {
        toast({
          description: "Please complete every personal information field before continuing.",
          variant: "destructive",
        });
        return;
      }
      if (step === 2 && !form.drivingLicenseUrl) {
        toast({ description: "Please upload your driving license before continuing.", variant: "destructive" });
        return;
      }
    }
    setStep(target);
  };

  const submitVerification = () => {
    if (!form.vehicleRegistrationUrl || !form.vehicleInsuranceUrl) {
      toast({
        description: "Please upload your vehicle registration and insurance documents.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/driver/verification", {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setVerificationStatus(data.driver.verificationStatus);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to submit verification",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/driver" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
        </Link>

        {verified ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
            <h1 className="mt-3 text-lg font-semibold text-emerald-900">You&apos;re verified</h1>
            <p className="mt-1 text-sm text-emerald-800">
              Your account has been reviewed and approved. Contact support to update any verification details.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">Verify your account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete these steps so parents can trust and connect with you.
            </p>

            {verificationStatus === "REJECTED" && driver.verificationRejectionReason && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-medium">Your last submission was rejected</p>
                <p className="mt-1">{driver.verificationRejectionReason}</p>
              </div>
            )}
            {verificationStatus === "PENDING_REVIEW" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Your documents are under review. You can still update them below if needed.
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              {steps.map((item, index) => (
                <div key={item.step} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => item.step < step && goToStep(item.step)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                        step > item.step
                          ? "border-blue-700 bg-blue-700 text-white"
                          : step === item.step
                            ? "border-blue-700 text-blue-700"
                            : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {step > item.step ? <Check className="h-4 w-4" aria-hidden="true" /> : item.step}
                    </span>
                    <span className={`text-xs font-medium ${step >= item.step ? "text-slate-950" : "text-slate-400"}`}>
                      {item.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${step > item.step ? "bg-blue-700" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Profile photo</p>
                    <div className="flex items-center gap-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                        {form.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <IdCard className="h-7 w-7 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                        {uploadingField === "image" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        {uploadingField === "image" ? "Uploading..." : "Change photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={!!uploadingField || isPending}
                          onChange={(event) => uploadFile(event, "image")}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Phone Number</p>
                    <Input
                      className={inputClass}
                      value={form.phoneNumber}
                      onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Address</p>
                    <Input
                      className={inputClass}
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Landmark</p>
                    <Input
                      className={inputClass}
                      value={form.landmark}
                      onChange={(event) => setForm((current) => ({ ...current, landmark: event.target.value }))}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={captureLocation} className="w-full gap-2">
                    <Crosshair className="h-4 w-4" aria-hidden="true" />
                    {form.liveAddress ? "GPS location captured" : "Capture current GPS location"}
                  </Button>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Utility bill</p>
                    <UploadCard
                      label="Utility bill"
                      hint="JPG or PNG, Max 5MB"
                      icon={FileBadge}
                      url={form.utilityBillUrl}
                      uploading={uploadingField === "utilityBillUrl"}
                      disabled={isPending}
                      onChange={(event) => uploadFile(event, "utilityBillUrl")}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Passport or NIN card</p>
                    <UploadCard
                      label="Identity document"
                      hint="JPG or PNG, Max 5MB"
                      icon={IdCard}
                      url={form.identityDocumentUrl}
                      uploading={uploadingField === "identityDocumentUrl"}
                      disabled={isPending}
                      onChange={(event) => uploadFile(event, "identityDocumentUrl")}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Upload a clear image of your valid FRSC driver&apos;s license.</p>
                  <UploadCard
                    label="Driving license"
                    hint="JPG or PNG, Max 5MB"
                    icon={IdCard}
                    url={form.drivingLicenseUrl}
                    uploading={uploadingField === "drivingLicenseUrl"}
                    disabled={isPending}
                    onChange={(event) => uploadFile(event, "drivingLicenseUrl")}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <p className="text-sm text-slate-500">Upload your vehicle documents for verification.</p>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Vehicle registration (particulars)</p>
                    <UploadCard
                      label="Vehicle registration"
                      hint="JPG or PNG, Max 5MB"
                      icon={FileBadge}
                      url={form.vehicleRegistrationUrl}
                      uploading={uploadingField === "vehicleRegistrationUrl"}
                      disabled={isPending}
                      onChange={(event) => uploadFile(event, "vehicleRegistrationUrl")}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Vehicle insurance</p>
                    <UploadCard
                      label="Vehicle insurance"
                      hint="JPG or PNG, Max 5MB"
                      icon={Car}
                      url={form.vehicleInsuranceUrl}
                      uploading={uploadingField === "vehicleInsuranceUrl"}
                      disabled={isPending}
                      onChange={(event) => uploadFile(event, "vehicleInsuranceUrl")}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => goToStep((step - 1) as 1 | 2)}
                  className="h-14 flex-1 rounded-lg text-base font-semibold shadow-none"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => goToStep((step + 1) as 2 | 3)}
                  className="h-14 flex-1 rounded-lg bg-blue-700 text-base font-semibold text-white shadow-none hover:bg-blue-800"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  disabled={isPending}
                  onClick={submitVerification}
                  className="h-14 flex-1 gap-2 rounded-lg bg-blue-700 text-base font-semibold text-white shadow-none hover:bg-blue-800"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isPending ? "Submitting..." : "Submit for verification"}
                </Button>
              )}
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Your documents are only used for verification.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
