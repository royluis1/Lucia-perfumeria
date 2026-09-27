import { Injectable } from '@nestjs/common';
import { CancellationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCancellationDto } from './dto/create-cancellation.dto';

@Injectable()
export class CancellationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCancellationDto) {
    return this.prisma.cancellationRequest.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        orderNumber: dto.orderNumber?.trim() || null,
        reason: dto.reason.trim(),
        status: CancellationStatus.OPEN,
      },
      select: { id: true, createdAt: true },
    });
  }

  async list(params?: { status?: CancellationStatus; limit?: number; offset?: number }) {
    const limit = Math.min(params?.limit ?? 50, 100);
    const offset = params?.offset ?? 0;
    const where: Prisma.CancellationRequestWhereInput = params?.status ? { status: params.status } : {};
    const [total, data] = await Promise.all([
      this.prisma.cancellationRequest.count({ where }),
      this.prisma.cancellationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);
    return { data, total, limit, offset };
  }

  async setStatus(id: string, status: CancellationStatus) {
    return this.prisma.cancellationRequest.update({
      where: { id },
      data: { status },
    });
  }
}