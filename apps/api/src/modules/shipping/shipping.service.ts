import { Injectable } from '@nestjs/common';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';

export type ShippingZone = 'AMBA' | 'interior-cercano' | 'interior-lejano' | 'Patagonia';

type ZoneRates = {
  baseCost: number;
  includedWeightGrams: number;
  extraWeightCost: number;
  estimatedDays: number;
};

const ZONE_RATES: Record<ShippingZone, ZoneRates> = {
  AMBA: { baseCost: 3500, includedWeightGrams: 1000, extraWeightCost: 900, estimatedDays: 2 },
  'interior-cercano': { baseCost: 5500, includedWeightGrams: 1000, extraWeightCost: 1200, estimatedDays: 4 },
  'interior-lejano': { baseCost: 7500, includedWeightGrams: 1000, extraWeightCost: 1500, estimatedDays: 6 },
  Patagonia: { baseCost: 9500, includedWeightGrams: 1000, extraWeightCost: 1800, estimatedDays: 8 },
};

@Injectable()
export class ShippingService {
  quote(dto: ShippingQuoteDto) {
    const zone = this.getZone(Number(dto.postalCode));

    if (dto.pickup === true) {
      return { cost: 0, estimatedDays: 0, zone, pickup: true };
    }

    const rates = ZONE_RATES[zone];
    const extraWeightBlocks = Math.ceil(
      Math.max(0, dto.weightGrams - rates.includedWeightGrams) / 1000,
    );
    const insurance = Math.round(dto.declaredValue * 0.01 * 100) / 100;

    return {
      cost: rates.baseCost + extraWeightBlocks * rates.extraWeightCost + insurance,
      estimatedDays: rates.estimatedDays,
      zone,
      pickup: false,
    };
  }

  private getZone(postalCode: number): ShippingZone {
    if (postalCode >= 1000 && postalCode <= 1899) return 'AMBA';
    if (postalCode >= 1900 && postalCode <= 3999) return 'interior-cercano';
    if (postalCode >= 8300) return 'Patagonia';
    return 'interior-lejano';
  }
}
