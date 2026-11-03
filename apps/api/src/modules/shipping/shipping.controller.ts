import { Body, Controller, Post } from '@nestjs/common';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  quote(@Body() dto: ShippingQuoteDto) {
    return this.shippingService.quote(dto);
  }
}
