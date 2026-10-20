import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { ProductGender } from '@prisma/client';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @Matches(SLUG_PATTERN, { message: 'slug must contain lowercase letters, numbers and hyphens only' })
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  brand!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  brandId?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price must be a valid number with at most 2 decimals' })
  @Min(0.01)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsString()
  @MinLength(1)
  @Matches(SKU_PATTERN, { message: 'sku must contain uppercase letters, numbers, underscores or hyphens' })
  sku!: string;

  @IsInt()
  @Min(0)
  weightGrams!: number;

  @IsEnum(ProductGender, { message: 'gender debe ser FEMENINO, MASCULINO o UNISEX' })
  gender!: ProductGender;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Elegí al menos una categoría' })
  @ArrayMaxSize(2, { message: 'Cada producto puede tener hasta 2 categorías' })
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
