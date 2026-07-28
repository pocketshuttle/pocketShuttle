import { SubscriptionPanel } from "@/components/billing/subscription-panel";

export const dynamic = "force-dynamic";

export default function SchoolBillingPage() {
  return <SubscriptionPanel audience="school" />;
}
