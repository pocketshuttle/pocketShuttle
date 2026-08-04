import "server-only";

import twilio from "twilio";

import { platformBaseUrl } from "@/lib/admin/request-security";

export async function sendPremiumChannel(input: {
  channel: "SMS" | "WHATSAPP";
  destination: string;
  message: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const configuredFrom =
    input.channel === "WHATSAPP"
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;
  if (!accountSid || !authToken || !configuredFrom) {
    throw new Error(`${input.channel} delivery is not configured`);
  }
  const prefix = input.channel === "WHATSAPP" ? "whatsapp:" : "";
  const normalize = (value: string) =>
    input.channel === "WHATSAPP" && !value.startsWith(prefix) ? `${prefix}${value}` : value;
  const result = await twilio(accountSid, authToken).messages.create({
    from: normalize(configuredFrom),
    to: normalize(input.destination),
    body: input.message,
    statusCallback: `${platformBaseUrl()}/api/notifications/twilio/status`,
  });
  return { providerMessageId: result.sid };
}
