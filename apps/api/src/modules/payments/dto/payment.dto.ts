import { IsBoolean, IsEnum, IsUUID } from 'class-validator';

export class CreatePaymentPreferenceDto {
  @IsUUID()
  orderId!: string;
}

export enum LocalPaymentEvent {
  PAYMENT = 'local.test.payment',
}

export enum LocalPaymentStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROCESS = 'IN_PROCESS',
}

export class LocalPaymentWebhookDto {
  @IsEnum(LocalPaymentEvent)
  event!: LocalPaymentEvent;

  @IsUUID()
  preferenceId!: string;

  @IsEnum(LocalPaymentStatus)
  status!: LocalPaymentStatus;

  @IsBoolean()
  sandbox!: boolean;
}
