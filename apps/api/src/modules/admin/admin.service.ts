import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const adminProductSelect = {
  id: true, slug: true, name: true, brand: true, description: true,
  price: true, stock: true, sku: true, isActive: true, weightGrams: true,
  createdAt: true, updatedAt: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  listProducts() {
    return this.prisma.product.findMany({ select: adminProductSelect, orderBy: { createdAt: 'desc' } });
  }

  async createProduct(actorId: string, dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({ data: dto, select: adminProductSelect });
      await this.auditLog.record(actorId, 'CREATE_PRODUCT', 'Product', product.id, {
        slug: product.slug,
        sku: product.sku,
      });
      return product;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async updateProduct(actorId: string, id: string, dto: UpdateProductDto) {
    await this.ensureProduct(id);
    try {
      const product = await this.prisma.product.update({ where: { id }, data: dto, select: adminProductSelect });
      await this.auditLog.record(actorId, 'UPDATE_PRODUCT', 'Product', id, {
        fields: Object.keys(dto),
      });
      return product;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async deactivateProduct(actorId: string, id: string) {
    await this.ensureProduct(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: adminProductSelect,
    });
    await this.auditLog.record(actorId, 'DEACTIVATE_PRODUCT', 'Product', id);
    return product;
  }

  listPendingReviews() {
    return this.prisma.review.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, rating: true, comment: true, isVerifiedPurchase: true, createdAt: true,
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async approveReview(actorId: string, id: string) {
    await this.ensureReview(id);
    const review = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, rating: true, comment: true, isApproved: true, createdAt: true },
    });
    await this.auditLog.record(actorId, 'APPROVE_REVIEW', 'Review', id);
    return review;
  }

  async deleteReview(actorId: string, id: string) {
    await this.ensureReview(id);
    await this.prisma.review.delete({ where: { id } });
    await this.auditLog.record(actorId, 'DELETE_REVIEW', 'Review', id);
    return { id, deleted: true };
  }

  listAuditLogs(page?: number, limit?: number) {
    return this.auditLog.list(page, limit);
  }

  private async ensureProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
  }

  private async ensureReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!review) throw new NotFoundException('Review not found');
  }

  private handleUniqueError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('slug or sku already exists');
    }
  }
}
