import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SettingsHeader({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <div className="mb-5">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
      </Link>
      <h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1>
    </div>
  );
}
