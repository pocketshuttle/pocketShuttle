"use server";
import { capitalizeName } from "@/lib/capitalize-name";
import twilio from "twilio";

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
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
    const messages = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+2348103955096",
      body: `Hello ${capitalizeName(parent_name)},\n ${capitalizeName(student_name)} bus is on its way for pick up and would arrive in ${eta}\n in  bus: ${bus_name}`,
    });
    return { message: "Mesasge sent", status: 200 };
  } catch (error) {
    return {
      message: "Error updating status",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
