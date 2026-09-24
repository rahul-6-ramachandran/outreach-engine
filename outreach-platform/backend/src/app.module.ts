import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { OpportunitiesModule } from './opportunities/opportunities.module.js';
import { OutreachModule } from './outreach/outreach.module.js';
import { ContactsModule } from './contacts/contacts.module.js';

@Module({
  imports: [
    DatabaseModule,
    OpportunitiesModule,
     OutreachModule,
     ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}