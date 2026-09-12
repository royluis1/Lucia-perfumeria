import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentPreferenceDto, LocalPaymentWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('preference')
  @UseGuards(JwtAuthGuard)
  createPreference(@Req() request: AuthenticatedRequest, @Body() body: CreatePaymentPreferenceDto) {
    return this.paymentsService.createPreference(request.userId, body.orderId);
  }

  @Post('webhook')
  receiveWebhook(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: LocalPaymentWebhookDto,
  ) {
    return this.paymentsService.receiveLocalWebhook(idempotencyKey, body);
  }
}
