import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateHomeHeroDto {
  @IsOptional()
  @IsUUID()
  productId?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  buttonLabel?: string | null;
}
