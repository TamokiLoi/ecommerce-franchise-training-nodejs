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
  static verifyEmail(username: string, token: string, originDomain?: string | undefined) {
    const domain = originDomain || process.env.DOMAIN_FE;

    return {
      subject: "Verify your email address",
      content: `Hello ${username},

        Please click the following link to verify your email address:
        ${domain}/verify-email/${token}

        If you did not request this, please ignore this email.`,
    };
  }

  static resetPassword(username: string, newPassword: string) {
    return {
      subject: "Your password has been reset",
      content: `Hello ${username},

        Your password has been reset successfully.

        Here is your new password:
        ${newPassword}

        Please use this password to log in and make sure to change your password immediately after logging in for security reasons.

        If you did not request this password reset, please contact our support team as soon as possible.

        Best regards,
        Support Team`,
    };
  }
}
