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
