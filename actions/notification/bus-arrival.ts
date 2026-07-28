"use server";
import { capitalizeName } from "@/lib/capitalize-name";
import twilio from "twilio";

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
type SMSType = {
  student_name: string;
  teacher?: string;
  message?: string;
  bus_name: string;
  phoneNumber?: string;
  parent_name: string;
  eta?: string;
};
const client = twilio(accountSid, authToken);

export const sendSmsForBusArrival = async ({
  student_name,
  parent_name,
  bus_name,
  phoneNumber,
  eta,
}: SMSType) => {
  try {
    if (!phoneNumber) {
      return {
        message: "Parent phone number is required",
        status: 400,
      };
    }

    if (!accountSid || !authToken || !whatsappFrom) {
      throw new Error("WhatsApp delivery is not configured");
    }
    const messages = await client.messages.create({
      from: whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${phoneNumber}`,
      body: `Hello ${capitalizeName(parent_name)},\n ${capitalizeName(student_name)} bus is on its way for pick up and would arrive in ${eta}\n in  bus: ${bus_name}`,
    });
    return { message: "Message accepted", status: 200, providerMessageId: messages.sid };
  } catch (error) {
    throw error instanceof Error ? error : new Error("WhatsApp delivery failed");
  }
};
