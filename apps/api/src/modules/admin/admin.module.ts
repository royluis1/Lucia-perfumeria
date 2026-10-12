import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CancellationService } from '../cancellation/cancellation.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule],
  controllers: [AdminController],
  providers: [AdminService, CancellationService],
})
export class AdminModule {}
