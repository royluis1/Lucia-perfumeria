import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateFeaturedOrderDto {
  @IsArray()
  @ArrayMaxSize(60)
  @IsString({ each: true })
  ids!: string[];
}
