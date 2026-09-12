import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(SLUG_PATTERN)
  slug?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  brand?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price?: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(SKU_PATTERN)
  sku?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
