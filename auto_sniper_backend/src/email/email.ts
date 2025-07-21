import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: "AutoSniper <krzysztof@staron.dev>",
    to: to,
    subject: subject,
    html: html,
  });
}
