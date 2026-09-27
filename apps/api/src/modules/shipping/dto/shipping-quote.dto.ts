import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class ShippingQuoteDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'postalCode debe tener 4 dígitos' })
  postalCode!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'weightGrams debe ser un número válido' })
  @Min(1, { message: 'weightGrams debe ser positivo' })
  weightGrams!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'declaredValue debe ser un decimal válido' })
  @Min(0, { message: 'declaredValue no puede ser negativo' })
  declaredValue!: number;

  @IsOptional()
  @IsBoolean()
  pickup?: boolean;
}
