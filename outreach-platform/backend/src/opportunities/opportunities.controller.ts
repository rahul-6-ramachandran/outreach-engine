import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { OpportunitiesService } from './opportunities.service.js';
import { CreateOpportunityDto } from './dto/create-opportunity.dto.js';

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly opportunitiesService: OpportunitiesService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.create(dto);
  }


@Get('matches/health')
getMatchingHealth() {
  return this.opportunitiesService.getMatchingHealth();
}

  @Get(':id/contacts')
getContacts(@Param('id') id: string) {
  return this.opportunitiesService.getContacts(Number(id));
}

@Get(':id/matches/:matchId')
getMatch(
  @Param('id') id: string,
  @Param('matchId') matchId: string,
) {
  return this.opportunitiesService.getMatch(
    Number(id),
    Number(matchId),
  );
}

@Get(':id/matches')
matchContacts(@Param('id') id: string) {
  return this.opportunitiesService.matchContacts(Number(id));
}

@Get(':id/matches/saved')
getSavedMatches(@Param('id') id: string) {
  return this.opportunitiesService.getSavedMatches(Number(id));
}

@Post(':id/matches/generate')
generateMatches(@Param('id') id: string) {
  return this.opportunitiesService.generateMatches(Number(id));
}

@Get(':id/matches/diagnostics')
getMatchDiagnostics(@Param('id') id: string) {
  return this.opportunitiesService.getMatchDiagnostics(Number(id));
}

}