"use server";
import twilio from "twilio";

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
type SMSType = {
  fullname: string;
  teacher?: string;
  message: string;
  bus: string;
  phoneNumber?: string;
  parent_name: string;
};
const client = twilio(accountSid, authToken);

export const sendSms = async ({
  fullname,
  parent_name,
  bus,
  teacher,
  message,
  phoneNumber,
}: SMSType) => {
  try {
    if (!phoneNumber || !accountSid || !authToken || !whatsappFrom) {
      throw new Error("WhatsApp delivery is not configured");
    }
    const messages = await client.messages.create({
      from: whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${phoneNumber}`,
      body: `Hello ${parent_name}\n ${fullname} is currently ${message}, bus: ${bus}`,
    });
    return { message: "Message accepted", status: 200, providerMessageId: messages.sid };
  } catch (error) {
    throw error instanceof Error ? error : new Error("WhatsApp delivery failed");
  }
};
