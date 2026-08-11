"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, HelpCircle, KeyRound, LifeBuoy, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { SettingsLogoutButton } from "@/components/settings/logout-button";
import { PushNotificationToggle } from "@/components/settings/push-notification-toggle";
import { SettingsGroup, SettingsRow, SettingsSectionLabel } from "@/components/settings/settings-rows";
import { SettingsHeader } from "@/components/settings/settings-header";
import { PLAN_CODES } from "@/lib/billing/catalog";
import { formatDate } from "@/components/parent-view/standalone/utils";

const BASE_URL = "https://www.pocketshuttle.com";

type ParentSettingsViewProps = {
  subscription: {
    planCode: string;
    planName: string;
    enforcementEnabled: boolean;
    maxChildren: number | null;
    maxConnectedDrivers: number | null;
  };
  childCount: number;
  driverCount: number;
  billingSummary: {
    freeTrial: number;
    active: number;
    pastDue: number;
    nextTrialEnd: Date | null;
  };
};

export function ParentSettingsView({ subscription, childCount, driverCount, billingSummary }: ParentSettingsViewProps) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const isFreePlan = subscription.planCode === PLAN_CODES.FREE_FAMILY;

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-10 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-xl">
        <SettingsHeader title="Settings & preferences" backHref="/parent" backLabel="Back to parent dashboard" />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Payment plan</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {subscription.planName}
            </span>
          </div>
          <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Children</span>
              <span className="font-semibold text-slate-950">
                {childCount}/{subscription.maxChildren ?? "Unlimited"}
              </span>
            </div>
            {subscription.enforcementEnabled &&
            subscription.maxChildren !== null &&
            childCount >= subscription.maxChildren ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your current children remain available. Upgrade before adding another child.
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm">
              <span className="text-slate-600">Connected drivers</span>
              <span className="font-semibold text-slate-950">
                {driverCount}/{subscription.maxConnectedDrivers ?? "Unlimited"}
              </span>
            </div>
            {subscription.enforcementEnabled &&
            subscription.maxConnectedDrivers !== null &&
            driverCount >= subscription.maxConnectedDrivers ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your current drivers remain available. Upgrade before adding another driver.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.freeTrial}</p>
              <p className="text-xs text-slate-500">Trials</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.pastDue}</p>
              <p className="text-xs text-slate-500">Past due</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Next trial ending: {billingSummary.nextTrialEnd ? formatDate(billingSummary.nextTrialEnd) : "N/A"}
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href="/billing">Manage PocketShuttle plan</Link>
          </Button>
          {!isFreePlan && (
            <Button asChild className="mt-2 w-full">
              <Link href="/parent/pro">Open Family Pro tools</Link>
            </Button>
          )}
        </div>

        <SettingsSectionLabel>Preferences</SettingsSectionLabel>
        <SettingsGroup>
          <PushNotificationToggle />
        </SettingsGroup>

        <SettingsSectionLabel>Account</SettingsSectionLabel>
        <SettingsGroup>
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
            href="/parent?openMenu=support"
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
