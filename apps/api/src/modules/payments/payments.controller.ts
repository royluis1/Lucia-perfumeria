import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentPreferenceDto, LocalPaymentWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

type MercadoPagoNotificationBody = {
  type?: string;
  topic?: string;
  data?: { id?: string | number };
};

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
  @HttpCode(200)
  receiveWebhook(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Body() body: LocalPaymentWebhookDto,
  ) {
    return this.paymentsService.receiveLocalWebhook(idempotencyKey, webhookSecret, body);
  }

  @Post('mercadopago/webhook')
  @HttpCode(200)
  receiveMercadoPagoWebhook(
    @Query('data.id') dataId: string | undefined,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Query('type') type: string | undefined,
    @Query('topic') topic: string | undefined,
    @Query('id') ipnId: string | undefined,
    @Body() body: MercadoPagoNotificationBody,
  ) {
    const resolvedId = dataId ?? ipnId ?? body?.data?.id?.toString();
    const resolvedType = type ?? topic ?? body?.type ?? body?.topic;
    return this.paymentsService.receiveMercadoPagoWebhook(
      resolvedId,
      xSignature,
      xRequestId,
      resolvedType,
    );
  }
}
