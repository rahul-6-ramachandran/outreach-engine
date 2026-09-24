import { Module } from '@nestjs/common';

import { OutreachService } from './outreach.service.js';
import { OutreachController } from './outreach.controller.js';
import { ContactsModule } from '../contacts/contacts.module.js';
import { LogEmailProvider } from './providers/log-email-provider.js';
import { EMAIL_PROVIDER } from './email-provider.token.js';
import { createEmailProvider } from './providers/email-provider.factory.js';

@Module({
  controllers: [OutreachController],
   providers: [
    OutreachService,
    {
      provide: EMAIL_PROVIDER,
      useFactory:  createEmailProvider,
    },
  ],
  exports: [OutreachService],
  imports:[
    ContactsModule
  ]
})
export class OutreachModule {}