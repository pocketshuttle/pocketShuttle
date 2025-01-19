import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = "https://app.pocketshuttle.com/";
// const domain = "http://localhost:3000/";

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}new-verification?token=${token}`;

  await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "Thank you for joining PocketShuttle, please confirm your email",
    html: `
      <div style="text-align: center; background-color: #000; padding: 20px; height: 40rem; width: 100%;">
        <small style="color: #b7cac1">PocketShuttle</small>
        <h1 style="font-size: 1.5rem; font-weight: bold;">Please confirm your account</h1>
        <p style="font-size: 1rem; color: #b7cac1">Thank you for signing up for PocketShuttle. To confirm your account, please click the button below.</p>
        <a href="${confirmLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Confirm email</a>
      </div>
   `,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const passwordLink = `${domain}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@pocketshuttle.com",
    to: email,
    subject: "Please click on the link to reset your password",
    html: `
      <div style="text-align: center; background-color: #000; padding: 20px; height: 40rem; width: 100%;">
        <small style="color: #b7cac1">PocketShuttle</small>
        <h1 style="font-size: 1.5rem; font-weight: bold;">Please click on the button to reset your password</h1>
        <p style="font-size: 1rem; color: #b7cac1">Thank you for signing up for PocketShuttle. To reset your password please click the button below.</p>
        <a href="${passwordLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
      </div>
   `,
  });
};
