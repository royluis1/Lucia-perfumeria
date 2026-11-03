import { BadRequestException } from '@nestjs/common';
import { ProductGender } from '@prisma/client';

export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugifyName(value: string): string {
  return normalizeName(value).replace(/ /g, '-');
}

export function cleanDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

const GENDER_BY_QUERY: Record<string, ProductGender> = {
  femenino: ProductGender.FEMENINO,
  masculino: ProductGender.MASCULINO,
  unisex: ProductGender.UNISEX,
};

export function parseProductGender(value: string): ProductGender {
  const parsed = GENDER_BY_QUERY[value.trim().toLowerCase()];
  if (!parsed) {
    throw new BadRequestException('gender debe ser femenino, masculino o unisex');
  }
  return parsed;
}
