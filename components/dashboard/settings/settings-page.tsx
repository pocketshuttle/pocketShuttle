"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  Bus,
  CreditCard,
  IdCard,
  Lock,
  MapPinned,
  Save,
  School,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { resetCurrentUserPassword } from "@/actions/reset";
import { updateSchoolSettings } from "@/actions/update-school-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableText } from "@/components/ui/copyable-text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

type SettingsPageProps = {
  school: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  settings: {
    pickupWindow: number;
    notifyDistance: number;
  };
  subscription: {
    plan: string;
    status: string;
    endDate: string | null;
  };
  auditLogs: {
    id: string;
    action: string;
    timestamp: string;
    details: {
      pickupWindow?: number;
      notifyDistance?: number;
    } | null;
  }[];
};

const tabs = [
  { value: "profile", label: "Profile", icon: School },
  { value: "commute", label: "Commute", icon: Bus },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: Lock },
  { value: "billing", label: "Billing", icon: CreditCard },
];

export function SettingsPage({
  school,
  settings,
  subscription,
  auditLogs,
}: SettingsPageProps) {
  const [pickupWindow, setPickupWindow] = useState(settings.pickupWindow);
  const [notifyDistance, setNotifyDistance] = useState(settings.notifyDistance);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | "unsupported">("unsupported");
  const [isPending, startTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSaveCommute = () => {
    startTransition(async () => {
      const result = await updateSchoolSettings({
        pickupWindow,
        notifyDistance,
      });

      if (result.status === 200 && result.settings) {
        setPickupWindow(result.settings.pickupWindow);
        setNotifyDistance(result.settings.notifyDistance);
      }

      toast({ description: result.message });
    });
  };

  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast({ description: "This browser does not support notifications." });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    toast({
      description:
        permission === "granted"
          ? "Browser notifications enabled."
          : "Browser notifications were not enabled.",
    });
  };

  const handleResetPassword = () => {
    startResetTransition(async () => {
      const result = await resetCurrentUserPassword();

      toast({ description: result.success || result.error });
    });
  };

  const commuteSettingsAreValid =
    Number.isInteger(pickupWindow) &&
    pickupWindow >= 5 &&
    pickupWindow <= 120 &&
    Number.isInteger(notifyDistance) &&
    notifyDistance >= 50 &&
    notifyDistance <= 5000;

  const notificationStatus =
    notificationPermission === "granted"
      ? "Enabled"
      : notificationPermission === "denied"
      ? "Blocked"
      : notificationPermission === "default"
      ? "Not enabled"
      : "Unsupported";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white px-4 py-4 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-black/55 dark:text-white/55">
            Settings
          </p>
          <h1 className="text-2xl font-semibold">
            {school.name || "School workspace"}
          </h1>
        </div>
        <Badge className="w-fit bg-black text-white dark:bg-white dark:text-black">
          Admin control center
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <TabsList className="grid h-auto items-stretch gap-1 rounded-lg border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-950">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="justify-start gap-2 rounded-md px-3 py-3 text-black/70 data-[state=active]:bg-black data-[state=active]:text-white dark:text-white/70 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="profile" className="mt-0">
            <SettingsPanel
              icon={<School className="h-5 w-5" />}
              title="School Profile"
              description="Primary school identity and support reference details."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ReadOnlyField label="School name" value={school.name} />
                <ReadOnlyField label="Admin email" value={school.email} />
                <ReadOnlyField label="Phone number" value={null} />
                <ReadOnlyField label="Address" value={null} />
                <div className="rounded-lg border border-black/10 p-3 dark:border-white/10 md:col-span-2">
                  <p className="mb-2 text-xs font-medium uppercase text-black/50 dark:text-white/50">
                    School/account ID
                  </p>
                  <CopyableText
                    label="School ID"
                    value={school.id}
                    truncateClassName="max-w-full"
                    className="font-mono text-sm text-black dark:text-white"
                  />
                </div>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="commute" className="mt-0">
            <SettingsPanel
              icon={<Bus className="h-5 w-5" />}
              title="Commute Settings"
              description="Operational defaults for pickup timing and parent proximity alerts."
              footer={
                <Button
                  type="button"
                  onClick={handleSaveCommute}
                  disabled={isPending || !commuteSettingsAreValid}
                  className="gap-2 bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/85"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving" : "Save commute settings"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  id="pickupWindow"
                  label="Pickup window"
                  suffix="minutes"
                  min={5}
                  max={120}
                  value={pickupWindow}
                  onChange={setPickupWindow}
                />
                <NumberField
                  id="notifyDistance"
                  label="Parent notification distance"
                  suffix="meters"
                  min={50}
                  max={5000}
                  value={notifyDistance}
                  onChange={setNotifyDistance}
                />
                <ReadOnlyMetric
                  icon={<MapPinned className="h-4 w-4" />}
                  label="Teacher location interval"
                  value="10 seconds"
                />
                <ReadOnlyMetric
                  icon={<MapPinned className="h-4 w-4" />}
                  label="Immediate movement threshold"
                  value="50 meters"
                />
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <SettingsPanel
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              description="Parent alert channels and browser push status."
            >
              <div className="grid gap-3">
                <StatusRow label="Pickup alerts" status="On by default" />
                <StatusRow label="Bus on the way alerts" status="On by default" />
                <StatusRow label="Arrival alerts" status="On by default" />
                <StatusRow label="System notices" status="On by default" />
                <StatusRow label="SMS alerts" status="Not configured" tone="muted" />
                <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/10">
                  <div>
                    <p className="font-medium">Web push</p>
                    <p className="text-sm text-black/55 dark:text-white/55">
                      Browser permission status
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{notificationStatus}</Badge>
                    {notificationPermission === "default" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRequestNotifications}
                      >
                        Enable
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SettingsPanel
              icon={<ShieldCheck className="h-5 w-5" />}
              title="User & Access"
              description="Current admin account and role boundaries."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ReadOnlyField label="Signed-in role" value="Admin" />
                <ReadOnlyField label="Account email" value={school.email} />
                <RoleSummary role="Admin" text="Manages school data, commute defaults, routes, reports, and settings." />
                <RoleSummary role="Teacher" text="Handles student attendance, pickup status, and live commute updates." />
                <RoleSummary role="Parent" text="Views assigned children, bus arrival state, and tracking updates." />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit gap-2"
                  onClick={handleResetPassword}
                  disabled={isResetPending}
                >
                  <UserRoundCog className="h-4 w-4" />
                  {isResetPending ? "Sending reset email" : "Send reset email"}
                </Button>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            <SettingsPanel
              icon={<CreditCard className="h-5 w-5" />}
              title="Billing / Plan"
              description="Current subscription snapshot and settings change history."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                  <p className="text-sm text-black/55 dark:text-white/55">
                    Current plan
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {subscription.plan}
                  </p>
                  <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                    Status: {subscription.status}
                  </p>
                  {subscription.endDate ? (
                    <p className="text-sm text-black/60 dark:text-white/60">
                      Renews/ends: {subscription.endDate}
                    </p>
                  ) : null}
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/dashboard/revenue">Open revenue</Link>
                  </Button>
                </div>

                <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                  <div className="mb-3 flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    <p className="font-medium">Recent settings changes</p>
                  </div>
                  {auditLogs.length ? (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-md bg-black/[0.03] px-3 py-2 text-sm dark:bg-white/[0.06]"
                        >
                          <p className="font-medium">{log.action}</p>
                          <p className="text-black/55 dark:text-white/55">
                            {log.timestamp}
                          </p>
                          {log.details ? (
                            <p className="text-black/65 dark:text-white/65">
                              Pickup {log.details.pickupWindow ?? "-"} min,
                              notify {log.details.notifyDistance ?? "-"} m
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-black/55 dark:text-white/55">
                      No settings changes recorded yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                School deletion is reserved for super-admin support.
              </div>
            </SettingsPanel>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SettingsPanel({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
      <div className="flex flex-col gap-3 border-b border-black/10 p-4 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-black/55 dark:text-white/55">
              {description}
            </p>
          </div>
        </div>
        {footer}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
      <p className="mb-1 text-xs font-medium uppercase text-black/50 dark:text-white/50">
        {label}
      </p>
      <p className="min-h-6 text-sm font-medium">{value || "Not configured"}</p>
    </div>
  );
}

function NumberField({
  id,
  label,
  suffix,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11"
        />
        <span className="w-20 text-sm text-black/55 dark:text-white/55">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function ReadOnlyMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-black/5 dark:bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm text-black/55 dark:text-white/55">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  tone = "default",
}: {
  label: string;
  status: string;
  tone?: "default" | "muted";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/10">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-black/55 dark:text-white/55">
          {status}
        </p>
      </div>
      <Badge
        variant="outline"
        className={
          tone === "muted"
            ? "text-black/50 dark:text-white/50"
            : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
        }
      >
        {tone === "muted" ? "Inactive" : "Active"}
      </Badge>
    </div>
  );
}

function RoleSummary({ role, text }: { role: string; text: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
      <p className="font-medium">{role}</p>
      <p className="mt-1 text-sm text-black/55 dark:text-white/55">{text}</p>
    </div>
  );
}
