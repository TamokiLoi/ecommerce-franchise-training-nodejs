import { sendMail } from "../utils";

export interface MailPayload {
  to: string;
  subject: string;
  content: string;
}

export class MailService {
  async send(payload: MailPayload): Promise<void> {
    await sendMail({
      toMail: payload.to,
      subject: payload.subject,
      content: payload.content,
    });
  }
}

export class MailTemplate {
  static verifyEmail(username: string, token: string) {
    const domain = process.env.DOMAIN_FE;

    return {
      subject: "Verify your email address",
      content: `Hello ${username},

        Please click the following link to verify your email address:
        ${domain}/verify-email/${token}

        If you did not request this, please ignore this email.`,
    };
  }

  static resetPassword(username: string, token: string) {
    const domain = process.env.DOMAIN_FE;

    return {
      subject: "Reset your password",
      content: `Hello ${username},

        Please click the following link to reset your password:
        ${domain}/reset-password/${token}

        If you did not request this, please ignore this email.`,
    };
  }
}
