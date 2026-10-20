import { IsString, MinLength } from 'class-validator';

export class MergeBrandDto {
  @IsString()
  @MinLength(1)
  targetId!: string;
}
