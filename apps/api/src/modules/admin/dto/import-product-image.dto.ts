import { IsString, IsUrl, MaxLength } from 'class-validator';

export class ImportProductImageDto {
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: true })
  url!: string;
}
