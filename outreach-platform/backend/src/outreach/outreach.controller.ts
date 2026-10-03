import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { OutreachService } from './outreach.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller()
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}


  @Get('outreach')
getHistory() {
  return this.outreachService.getOutreachHistory();
}

  @Get('opportunities/:opportunityId/matches/:matchId/draft')
  generateDraft(
    @Param('opportunityId') opportunityId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.outreachService.generateMatchDraft(
      Number(opportunityId),
      Number(matchId),
    );
  }

    @Post(
      'opportunities/:opportunityId/matches/:matchId/outreach',
    )
    createDraft(
      @Param('opportunityId') opportunityId: string,
      @Param('matchId') matchId: string,
    ) {
      return this.outreachService.createDraft(
        Number(opportunityId),
        Number(matchId),
      );
    }

  @Post('outreach/:outreachId/approve')
  approve(@Param('outreachId') outreachId: string) {
    return this.outreachService.approveOutreach(Number(outreachId));
  }


    @Post('outreach/:outreachId/send')
  send(
    @Param('outreachId') outreachId: string,
  ) {
    return this.outreachService.sendOutreach(
      Number(outreachId),
    );
  }

  // @Post('outreach/:outreachId/cancel')
  // cancel(
  //   @Param('outreachId') outreachId: string,
  // ) {
  //   return this.outreachService.cancelOutreach(
  //     Number(outreachId),
  //   );
  // }

  // @Post('outreach/recover-stale')
  // recoverStaleOutreach() {
  //   return this.outreachService.recoverStaleOutreachAttempts();
  // }
}
