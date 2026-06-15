import { Resend } from "resend";
import PocketshuttleResetPasswordEmail from "../components/emails/reset-password";
import PocketshuttleLoginCodeEmail from "../components/emails/confirm-email";
import React from "react";

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
