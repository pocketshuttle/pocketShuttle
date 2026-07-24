import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BillingReturnPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-semibold">Payment received</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your plan will update as soon as Paystack confirms the payment.
        </p>
        <Button asChild className="mt-5">
          <Link href="/billing">Return to billing</Link>
        </Button>
      </section>
    </main>
  );
}
