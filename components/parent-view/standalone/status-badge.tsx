import { statusTone } from "./utils";

export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>
      {(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}
