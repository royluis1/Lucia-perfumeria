import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const adminProductSelect = {
  id: true, slug: true, name: true, brand: true, description: true,
  price: true, stock: true, sku: true, isActive: true, weightGrams: true,
  category: true, imageUrl: true, createdAt: true, updatedAt: true,
} satisfies Prisma.ProductSelect;

const orderInclude = {
  user: { select: { id: true, email: true, name: true } },
  items: {
    include: { product: { select: { id: true, slug: true, name: true, brand: true, sku: true } } },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.OrderInclude;

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

  async listOrders(page?: number, limit?: number) {
    const take = limit && limit > 0 && limit <= 100 ? limit : 20;
    const skip = page && page > 0 ? (page - 1) * take : 0;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count(),
    ]);
    return {
      data: orders.map((order) => ({
        ...order,
        subtotal: order.subtotal.toString(),
        shippingCost: order.shippingCost.toString(),
        total: order.total.toString(),
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
          product: item.product,
        })),
      })),
      page: page && page > 0 ? page : 1,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  async updateOrder(actorId: string, id: string, dto: UpdateOrderStatusDto) {
    if (!dto.status && !dto.paymentStatus) {
      throw new BadRequestException('Enviá al menos status o paymentStatus');
    }
    await this.ensureOrder(id);
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.paymentStatus !== undefined ? { paymentStatus: dto.paymentStatus } : {}),
      },
      include: orderInclude,
    });
    await this.auditLog.record(actorId, 'UPDATE_ORDER', 'Order', id, {
      fields: Object.keys(dto),
    });
    return this.serializeOrder(order);
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        mfaEnabled: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async updateUser(actorId: string, id: string, dto: UpdateUserRoleDto) {
    await this.ensureUser(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.mfaEnabled !== undefined ? { mfaEnabled: dto.mfaEnabled } : {}),
      },
      select: {
        id: true, email: true, name: true, role: true, mfaEnabled: true,
      },
    });
    await this.auditLog.record(actorId, 'UPDATE_USER', 'User', id, {
      fields: Object.keys(dto),
    });
    return user;
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

  private async ensureOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw new NotFoundException('Order not found');
  }

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
  }

  private serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
    return {
      ...order,
      subtotal: order.subtotal.toString(),
      shippingCost: order.shippingCost.toString(),
      total: order.total.toString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString(),
        product: item.product,
      })),
    };
  }

  private handleUniqueError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('slug or sku already exists');
    }
  }
}
