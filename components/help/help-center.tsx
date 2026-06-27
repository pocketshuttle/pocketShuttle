"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Bus,
  FileBarChart,
  HelpCircle,
  Mail,
  MapPinned,
  Route,
  School,
  Settings,
  ShieldQuestion,
  UsersRound,
} from "lucide-react";

const supportEmail = "support@pocketshuttle.app";
const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  "PocketShuttle Support Request"
)}&body=${encodeURIComponent(
  "Hi PocketShuttle Support,\n\nI need help with:\n\nSchool name:\nAccount email:\n\nDetails:"
)}`;

const setupFaqs = [
  {
    question: "What should I set up first?",
    answer:
      "Start with routes, then add buses, teachers or drivers, students, and parents. Students become useful in commute views once they are assigned to a bus and linked to a parent.",
  },
  {
    question: "Why should routes be added before buses?",
    answer:
      "Buses are connected to routes, so creating routes first keeps bus setup clean and makes commute reporting easier to understand.",
  },
  {
    question: "How do I add a teacher or driver?",
    answer:
      "Open Teachers or Drivers from the dashboard sidebar, use the add button, complete the profile, and wait for any image upload preview to finish before submitting.",
  },
  {
    question: "How do I link a student to a parent?",
    answer:
      "Open the Parent page, choose the parent, and add the student from the available student selector. A student should only be linked to the correct guardian account.",
  },
];

const trackingFaqs = [
  {
    question: "How does live tracking work?",
    answer:
      "Teachers share location from the teacher view while commute activity is active. Parents see updates for students linked to them, and admins can monitor school commute activity from the map and commute pages.",
  },
  {
    question: "Why is a parent not seeing tracking updates?",
    answer:
      "Check that the student is linked to the parent, assigned to a bus, and that the assigned teacher has location permission enabled on their device.",
  },
  {
    question: "What do pickup, dropped, and on-the-way mean?",
    answer:
      "Pickup status tracks whether a student has been picked. Presence shows whether the student is at school, in bus, on the way, or has no active commute state.",
  },
  {
    question: "How are reports generated?",
    answer:
      "Reports use pickup logs and bus-arrival timestamps. For accurate on-time and late pickup reports, teachers need to mark pickups and the arrival flow needs to record arrival times.",
  },
];

const accountFaqs = [
  {
    question: "How do password resets work?",
    answer:
      "Admins can send their own reset email from Settings. Teachers and parents can use the reset page with their email and role, then complete the reset from the email link.",
  },
  {
    question: "How do browser notifications work?",
    answer:
      "Parents and teachers need to allow browser notifications on their device. If notifications are blocked, they must be re-enabled from the browser or device settings.",
  },
  {
    question: "Where do I change commute defaults?",
    answer:
      "Open Dashboard Settings, then Commute. Pickup window and parent notification distance are saved there.",
  },
];

const quickActions = [
  {
    title: "Set up transport",
    description: "Create routes, buses, teachers, drivers, students, and parents.",
    href: "/dashboard/bus",
    icon: Bus,
  },
  {
    title: "Monitor commute",
    description: "Review student status, attendance, and current commute state.",
    href: "/dashboard/commute",
    icon: Route,
  },
  {
    title: "View reports",
    description: "Check pickup timing, late pickup details, and weekly trends.",
    href: "/dashboard/report",
    icon: FileBarChart,
  },
  {
    title: "Adjust settings",
    description: "Manage commute defaults, notification status, and account access.",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export const HelpCenter = () => {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <section className="rounded-lg border border-black/10 bg-white p-5 text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-black/55 dark:text-white/55">
              Support
            </p>
            <h1 className="text-2xl font-semibold">Help Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/60 dark:text-white/60">
              Find answers for setup, live tracking, reports, notifications, and account access.
            </p>
          </div>
          <Badge className="w-fit bg-black text-white dark:bg-white dark:text-black">
            Email support available
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-lg border border-black/10 bg-white p-4 text-black transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.05]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold">{action.title}</h2>
              <p className="mt-2 text-sm text-black/55 dark:text-white/55">
                {action.description}
              </p>
              <p className="mt-4 text-sm font-medium text-black dark:text-white">
                Open section
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
          <div className="border-b border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
            </div>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Practical answers for the workflows schools use most.
            </p>
          </div>

          <div className="grid gap-4 p-4">
            <FaqGroup title="Setup" icon={<School className="h-4 w-4" />} items={setupFaqs} />
            <FaqGroup title="Tracking & Reports" icon={<MapPinned className="h-4 w-4" />} items={trackingFaqs} />
            <FaqGroup title="Account & Notifications" icon={<Bell className="h-4 w-4" />} items={accountFaqs} />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <SupportCard
            icon={<Mail className="h-5 w-5" />}
            title="Email Support"
            description="Send details and the support team can follow up with your school account context."
            href={supportMailto}
            action="Compose email"
          />
          <SupportCard
            icon={<UsersRound className="h-5 w-5" />}
            title="Parent or Teacher Access"
            description="If someone cannot log in, confirm their role, email, and verification/reset status."
            href="/dashboard/teachers"
            action="Review users"
          />
          <SupportCard
            icon={<ShieldQuestion className="h-5 w-5" />}
            title="Settings & Passwords"
            description="Send an admin reset email or review commute defaults from Settings."
            href="/dashboard/settings"
            action="Open settings"
          />
        </aside>
      </section>
    </div>
  );
};

function FaqGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { question: string; answer: string }[];
}) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <Accordion type="single" collapsible className="px-4">
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`${title}-${index}`}>
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-black/60 dark:text-white/60">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  const isEmail = href.startsWith("mailto:");

  return (
    <Link
      href={href}
      target={isEmail ? "_blank" : undefined}
      rel={isEmail ? "noopener noreferrer" : undefined}
      className="rounded-lg border border-black/10 bg-white p-4 text-black transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {description}
          </p>
          <span className="mt-4 inline-flex h-8 items-center rounded-md border border-black/10 px-3 text-xs font-medium dark:border-white/10">
            {action}
          </span>
        </div>
      </div>
    </Link>
  );
}
