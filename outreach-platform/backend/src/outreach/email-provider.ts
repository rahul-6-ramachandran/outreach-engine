export interface EmailAttachment {
  filename: string;
  path: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  providerMessageId?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}