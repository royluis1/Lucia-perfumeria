import { Body, Controller, Post } from '@nestjs/common';
import { CreateCancellationDto } from './dto/create-cancellation.dto';
import { CancellationService } from './cancellation.service';

@Controller()
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}

  @Post('cancellations')
  create(@Body() body: CreateCancellationDto) {
    return this.cancellationService.create(body);
  }
}