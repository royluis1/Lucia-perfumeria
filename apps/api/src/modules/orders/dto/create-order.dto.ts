import { BadRequestException } from '@nestjs/common';

export interface ShippingAddress {
  recipient: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CreateOrderDto {
  shippingAddress: ShippingAddress;
}

export function parseShippingAddress(value: unknown): ShippingAddress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('shippingAddress debe ser un objeto');
  }
  const address = value as Record<string, unknown>;
  const required = ['recipient', 'street', 'city', 'postalCode', 'country'];
  for (const key of required) {
    if (typeof address[key] !== 'string' || !address[key].trim() || address[key].length > 200) {
      throw new BadRequestException(`${key} es requerido y debe ser texto válido`);
    }
    const allowed = new Set([...required, 'state', 'phone']);
    for (const key of Object.keys(address)) {
      if (!allowed.has(key)) {
        throw new BadRequestException(`Campo no permitido: ${key}`);
      }
    }
    if (!/^\d{4}$/.test(address.postalCode as string)) {
      throw new BadRequestException('postalCode debe tener 4 dígitos');
    }
  }
  for (const key of ['state', 'phone']) {
    if (address[key] !== undefined && (typeof address[key] !== 'string' || address[key].length > 100)) {
      throw new BadRequestException(`${key} debe ser texto válido`);
    }
  }
  return {
    recipient: address.recipient as string,
    street: address.street as string,
    city: address.city as string,
    postalCode: address.postalCode as string,
    country: address.country as string,
    ...(address.state === undefined ? {} : { state: address.state as string }),
    ...(address.phone === undefined ? {} : { phone: address.phone as string }),
  };
}
