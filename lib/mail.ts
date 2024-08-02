import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `http://localhost:3000/new-verification?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
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
