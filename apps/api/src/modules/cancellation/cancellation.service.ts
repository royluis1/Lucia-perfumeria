import { BadRequestException, Injectable } from '@nestjs/common';
import { CancellationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCancellationDto } from './dto/create-cancellation.dto';

@Injectable()
export class CancellationService {
  constructor(private readonly prisma: PrismaService) {}

  private parseStatus(value?: CancellationStatus): CancellationStatus | undefined {
    if (value === undefined) return undefined;
    if (!Object.values(CancellationStatus).includes(value)) {
      throw new BadRequestException('status inválido');
    }
    return value;
  }

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
    const where: Prisma.CancellationRequestWhereInput = this.parseStatus(params?.status)
      ? { status: this.parseStatus(params?.status) }
      : {};
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
    const parsed = this.parseStatus(status);
    if (!parsed) {
      throw new BadRequestException('status requerido');
    }
    await this.prisma.cancellationRequest.findUniqueOrThrow({ where: { id } });
    return this.prisma.cancellationRequest.update({
      where: { id },
      data: { status: parsed },
    });
  }
}