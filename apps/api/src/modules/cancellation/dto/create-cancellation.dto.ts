import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreateCancellationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9-]*$/, { message: 'orderNumber may only contain letters, digits and dashes' })
  orderNumber?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  reason!: string;
}