import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentPreferenceDto, LocalPaymentWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('status')
  status() {
    return this.paymentsService.getCheckoutStatus();
  }

  @Post('preference')
  @UseGuards(JwtAuthGuard)
  createPreference(@Req() request: AuthenticatedRequest, @Body() body: CreatePaymentPreferenceDto) {
    return this.paymentsService.createPreference(request.userId, body.orderId);
  }

  @Post('webhook')
  receiveWebhook(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Body() body: LocalPaymentWebhookDto,
  ) {
    return this.paymentsService.receiveLocalWebhook(idempotencyKey, webhookSecret, body);
  }

  @Post('mercadopago/webhook')
  receiveMercadoPagoWebhook(
    @Query('data.id') dataId: string | undefined,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
  ) {
    return this.paymentsService.receiveMercadoPagoWebhook(dataId, xSignature, xRequestId);
  }
}
