import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SettingsSectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 first:mt-0">{children}</p>;
}

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">{children}</div>;
}

type SettingsRowProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  trailingLabel?: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

export function SettingsRow({ icon, title, subtitle, trailingLabel, href, external, onClick }: SettingsRowProps) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">{icon}</span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {trailingLabel && <span className="shrink-0 text-sm font-medium text-blue-700">{trailingLabel}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    </>
  );

  const className = "flex w-full items-center gap-3 bg-white p-4 text-left transition hover:bg-slate-50";

  if (href) {
    return (
      <Link href={href} className={className} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function SettingsToggleRow({
  icon,
  title,
  subtitle,
  control,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-white p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
