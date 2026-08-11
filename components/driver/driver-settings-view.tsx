"use client";

import { useState } from "react";
import { BadgeCheck, FileText, HelpCircle, KeyRound, LifeBuoy, ShieldCheck } from "lucide-react";

import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { SettingsLogoutButton } from "@/components/settings/logout-button";
import { PushNotificationToggle } from "@/components/settings/push-notification-toggle";
import { SettingsGroup, SettingsRow, SettingsSectionLabel } from "@/components/settings/settings-rows";
import { SettingsHeader } from "@/components/settings/settings-header";

const BASE_URL = "https://www.pocketshuttle.com";

type DriverSettingsViewProps = {
  verificationStatus: "UNSUBMITTED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
};

function verificationCopy(status: DriverSettingsViewProps["verificationStatus"]) {
  if (status === "VERIFIED") return { title: "Account verified", subtitle: "Your documents have been approved" };
  if (status === "PENDING_REVIEW") return { title: "Verification pending", subtitle: "We're reviewing your documents" };
  if (status === "REJECTED") return { title: "Verification rejected", subtitle: "Resubmit your documents" };
  return { title: "Verify your account", subtitle: "Required before you can be connected to parents" };
}

export function DriverSettingsView({ verificationStatus }: DriverSettingsViewProps) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const verification = verificationCopy(verificationStatus);

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-10 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-xl">
        <SettingsHeader title="Settings & preferences" backHref="/driver" backLabel="Back to dashboard" />

        <SettingsSectionLabel>Preferences</SettingsSectionLabel>
        <SettingsGroup>
          <PushNotificationToggle />
        </SettingsGroup>

        <SettingsSectionLabel>Account</SettingsSectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
            title={verification.title}
            subtitle={verification.subtitle}
            href="/driver/verify"
          />
          <SettingsRow
            icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            title="Change password"
            subtitle="Update your account password"
            onClick={() => setChangePasswordOpen(true)}
          />
          <SettingsRow
            icon={<LifeBuoy className="h-4 w-4" aria-hidden="true" />}
            title="Help & support"
            subtitle="Get help and contact support"
            href="/driver?openMenu=support"
          />
          <SettingsRow
            icon={<HelpCircle className="h-4 w-4" aria-hidden="true" />}
            title="Frequently asked questions"
            subtitle="Read common questions and answers"
            href={`${BASE_URL}/faq`}
            external
          />
          <SettingsRow
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            title="Privacy policy"
            subtitle="Read our privacy policy"
            href={`${BASE_URL}/privacy`}
            external
          />
          <SettingsRow
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            title="Terms & conditions"
            subtitle="Read our terms and conditions"
            href={`${BASE_URL}/terms`}
            external
          />
        </SettingsGroup>

        <SettingsLogoutButton />
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </main>
  );
}
