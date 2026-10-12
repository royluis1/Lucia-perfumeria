import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  mfaEnabled?: boolean;
}