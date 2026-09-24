import {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../email-provider.js';

export class LogEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    console.log('\n========== EMAIL SEND ==========');
    console.log(`To: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log('--------------------------------');
    console.log(input.body);
    console.log('================================\n');

    return {
      providerMessageId: `dev-${Date.now()}`,
    };
  }

//   async send(input: SendEmailInput): Promise<SendEmailResult> {
//   console.log('\n========== EMAIL SEND ==========');
//   console.log(`To: ${input.to}`);
//   console.log(`Subject: ${input.subject}`);
//   console.log('--------------------------------');
//   console.log(input.body);
//   console.log('================================\n');

//   throw new Error('Simulated email provider failure');
// }
}