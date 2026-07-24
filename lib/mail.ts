import { Resend } from "resend";
import PocketshuttleResetPasswordEmail from "../components/emails/reset-password";
import PocketshuttleLoginCodeEmail from "../components/emails/confirm-email";
import React from "react";
import { platformBaseUrl } from "@/lib/admin/request-security";

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = "https://app.pocketshuttle.com/";
// const domain = "http://localhost:3000/";

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}new-verification?token=${token}`;

  await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "Thank you for joining PocketShuttle, please confirm your email",
    react: React.createElement(PocketshuttleLoginCodeEmail, {
      verificationLink: confirmLink,
    }),
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const passwordLink = `${domain}reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "Pocketshuttle reset your password",
    react: React.createElement(PocketshuttleResetPasswordEmail, {
      resetPasswordLink: passwordLink,
    }),
  });
};

export const sendDriverInviteEmail = async ({
  email,
  token,
  parentName,
}: {
  email: string;
  token: string;
  parentName?: string | null;
}) => {
  const inviteLink = `${domain}register?role=driver&invite=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "You have been invited to join PocketShuttle as a driver",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>PocketShuttle driver invite</h2>
        <p>${parentName || "A parent"} invited you to manage school pickup and dropoff updates on PocketShuttle.</p>
        <p><a href="${inviteLink}" style="display:inline-block;background:#4a48ff;color:white;padding:12px 16px;border-radius:8px;text-decoration:none;">Create driver account</a></p>
        <p>If the button does not work, open this link: ${inviteLink}</p>
      </div>
    `,
  });
};

export const sendPlatformAdminInviteEmail = async ({
  email,
  token,
  inviterName,
  role,
}: {
  email: string;
  token: string;
  inviterName?: string | null;
  role: string;
}) => {
  const inviteLink = `${platformBaseUrl()}/admin/invite?token=${encodeURIComponent(token)}`;
  const result = await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "You have been invited to PocketShuttle Platform Admin",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>PocketShuttle platform invitation</h2>
        <p>${inviterName || "A PocketShuttle owner"} invited you to join the platform admin console as <strong>${role.replaceAll("_", " ")}</strong>.</p>
        <p>This invitation expires in 48 hours and can only be used once.</p>
        <p><a href="${inviteLink}" style="display:inline-block;background:#4a48ff;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none">Accept invitation</a></p>
        <p>If the button does not work, open this link: ${inviteLink}</p>
      </div>
    `,
  });
  if (result.error) {
    throw new Error(result.error.message || "Unable to deliver admin invitation");
  }
};
