"use server";
import twilio from "twilio";

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
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
    const messages = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+2348103955096",
      body: `Hello ${parent_name}\n ${fullname} is currently ${message}, bus: ${bus}`,
    });
    console.log(messages);
    return { message: "Mesasge sent", status: 200 };
  } catch (error) {
    return {
      message: "Error updating status",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
