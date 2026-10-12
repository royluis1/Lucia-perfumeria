import { IsInt, IsNotEmpty, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  @Matches(/\S/, { message: 'comment must contain non-whitespace characters' })
  comment!: string;
}
