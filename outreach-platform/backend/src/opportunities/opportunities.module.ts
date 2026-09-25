import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller.js';
import { OpportunitiesService } from './opportunities.service.js';
import { OutreachModule } from '../outreach/outreach.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  imports:[OutreachModule,AuthModule]
})
export class OpportunitiesModule {}
