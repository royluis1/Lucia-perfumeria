import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CancellationStatus } from '@prisma/client';
import { CreateCancellationDto } from './dto/create-cancellation.dto';
import { CancellationService } from './cancellation.service';

@Controller()
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}

  @Post('cancellations')
  create(@Body() body: CreateCancellationDto) {
    return this.cancellationService.create(body);
  }

  @Get('cancellations')
  list(@Query('status') status?: CancellationStatus) {
    return this.cancellationService.list({ status });
  }

  @Patch('cancellations/:id')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Query('status') status: CancellationStatus) {
    return this.cancellationService.setStatus(id, status);
  }
}