import Link from "next/link";
import { CheckCircle2, MapPin, Bell, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const PERKS = [
  {
    icon: MapPin,
    title: "Live trip tracking",
    description: "Follow every pickup and drop-off in real time, right from your dashboard.",
  },
  {
    icon: Bell,
    title: "Instant alerts",
    description: "Get notified the moment your child boards, arrives, or if anything needs attention.",
  },
  {
    icon: ShieldCheck,
    title: "Extra peace of mind",
    description: "Enjoy extended history, recurring trips, and priority support built for busy families.",
  },
];

export default function BillingReturnPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold">Thank you for subscribing!</h1>
        <p className="mt-2 text-sm text-slate-600">
          We're thrilled to have you on PocketShuttle Pro. Your plan will update
          automatically as soon as Paystack confirms the payment — usually within
          a few moments.
        </p>

        <ul className="mt-6 space-y-4 text-left">
          {PERKS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-slate-500">
          Thank you for trusting PocketShuttle to help keep your family safe on
          every trip.
        </p>

        <Button asChild className="mt-5 w-full">
          <Link href="/billing">Return to billing</Link>
        </Button>
      </section>
    </main>
  );
}
