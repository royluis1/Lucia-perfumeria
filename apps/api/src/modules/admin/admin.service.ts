import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand, Category, ProductImage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { cleanDisplayName, normalizeName, slugifyName } from '../../common/catalog.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user.dto';
import { UpdateHomeHeroDto } from './dto/update-home-hero.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StorageService } from '../storage/storage.service';

const MAX_PRODUCT_IMAGES = 8;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const adminProductSelect = {
  id: true, slug: true, name: true, brand: true, description: true,
  price: true, stock: true, sku: true, isActive: true, weightGrams: true,
  category: true, gender: true, imageUrl: true, featured: true, featuredOrder: true,
  createdAt: true, updatedAt: true,
  brandRef: { select: { id: true, name: true, slug: true } },
  categories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { position: 'asc' as const },
  },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
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
    private readonly storage: StorageService,
  ) {}

  listProducts() {
    return this.prisma.product.findMany({ select: adminProductSelect, orderBy: { createdAt: 'desc' } });
  }

  async createProduct(actorId: string, dto: CreateProductDto) {
    const { brandId, categoryIds, category: legacyCategory, ...rest } = dto;
    const brand = await this.resolveBrand(brandId, dto.brand);
    if (!brand) throw new BadRequestException('Marca inválida');
    const categories = await this.resolveCategories(categoryIds, legacyCategory);
    if (categories.length === 0) {
      throw new BadRequestException('Cada producto necesita al menos una categoría');
    }
    try {
      const product = await this.prisma.product.create({
        data: {
          ...rest,
          brand: brand.name,
          brandId: brand.id,
          category: categories[0].name,
          categories: {
            create: categories.map((category, index) => ({ categoryId: category.id, position: index })),
          },
          ...(dto.imageUrl
            ? {
                images: {
                  create: { url: dto.imageUrl, position: 0, alt: `${dto.name} — ${brand.name}` },
                },
              }
            : {}),
        },
        select: adminProductSelect,
      });
      await this.auditLog.record(actorId, 'CREATE_PRODUCT', 'Product', product.id, {
        slug: product.slug,
        sku: product.sku,
        brandId: brand.id,
        categoryIds: categories.map((category) => category.id),
      });
      return product;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async updateProduct(actorId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    const { brandId, categoryIds, category: legacyCategory, ...rest } = dto;
    const data: Prisma.ProductUpdateInput = { ...rest };
    let unfeaturedByDeactivation = false;
    let newCategories: Category[] | null = null;

    const brand = await this.resolveBrand(brandId, dto.brand);
    if (brand) {
      data.brand = brand.name;
      data.brandRef = { connect: { id: brand.id } };
    }

    if (categoryIds !== undefined || legacyCategory !== undefined) {
      newCategories = await this.resolveCategories(categoryIds, legacyCategory);
      if (newCategories.length === 0) {
        throw new BadRequestException('Cada producto necesita al menos una categoría');
      }
      data.category = newCategories[0].name;
    }

    if (dto.featured === true) {
      const willBeActive = dto.isActive ?? existing.isActive;
      const willHaveStock = dto.stock ?? existing.stock;
      if (!willBeActive) {
        throw new BadRequestException('No se puede destacar un producto inactivo');
      }
      if (willHaveStock <= 0) {
        throw new BadRequestException('No se puede destacar un producto sin stock');
      }
      if (!existing.featured) {
        const highest = await this.prisma.product.aggregate({
          where: { featured: true },
          _max: { featuredOrder: true },
        });
        data.featuredOrder = (highest._max.featuredOrder ?? 0) + 1;
      }
    }

    if (dto.isActive === false && existing.featured && dto.featured !== true) {
      data.featured = false;
      unfeaturedByDeactivation = true;
    }

    try {
      const product = await this.prisma.product.update({ where: { id }, data, select: adminProductSelect });
      if (newCategories) {
        await this.prisma.productCategory.deleteMany({ where: { productId: id } });
        await this.prisma.productCategory.createMany({
          data: newCategories.map((category, index) => ({
            productId: id,
            categoryId: category.id,
            position: index,
          })),
        });
      }
      if (dto.imageUrl !== undefined) {
        const imageCount = await this.prisma.productImage.count({ where: { productId: id } });
        if (imageCount === 0 && dto.imageUrl) {
          await this.prisma.productImage.create({
            data: { productId: id, url: dto.imageUrl, position: 0, alt: `${product.name} — ${product.brand}` },
          });
        }
      }
      const action =
        dto.featured === true ? 'FEATURE_PRODUCT' : dto.featured === false ? 'UNFEATURE_PRODUCT' : 'UPDATE_PRODUCT';
      await this.auditLog.record(actorId, action, 'Product', id, {
        fields: Object.keys(dto),
        ...(unfeaturedByDeactivation ? { unfeaturedByDeactivation: true } : {}),
      });
      return product;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async deactivateProduct(actorId: string, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false, ...(existing.featured ? { featured: false } : {}) },
      select: adminProductSelect,
    });
    await this.auditLog.record(
      actorId,
      'DEACTIVATE_PRODUCT',
      'Product',
      id,
      existing.featured ? { unfeatured: true } : {},
    );
    return product;
  }

  async listBrands() {
    const brands = await this.prisma.brand.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      productCount: brand._count.products,
    }));
  }

  async createBrand(actorId: string, dto: CreateBrandDto) {
    const name = cleanDisplayName(dto.name);
    const normalizedName = normalizeName(name);
    if (!normalizedName) throw new BadRequestException('Nombre de marca inválido');
    const existing = await this.prisma.brand.findUnique({ where: { normalizedName } });
    if (existing) throw new ConflictException('Ya existe una marca con ese nombre');
    const brand = await this.createBrandRow(name, normalizedName);
    await this.auditLog.record(actorId, 'CREATE_BRAND', 'Brand', brand.id, {
      name: brand.name,
      slug: brand.slug,
    });
    return brand;
  }

  async updateBrand(actorId: string, id: string, dto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Brand not found');
    const name = cleanDisplayName(dto.name);
    const normalizedName = normalizeName(name);
    if (!normalizedName) throw new BadRequestException('Nombre de marca inválido');
    const duplicate = await this.prisma.brand.findUnique({ where: { normalizedName } });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Ya existe otra marca con ese nombre');
    }
    const [brand, products] = await this.prisma.$transaction([
      this.prisma.brand.update({ where: { id }, data: { name, slug: slugifyName(name), normalizedName } }),
      this.prisma.product.updateMany({ where: { brandId: id }, data: { brand: name } }),
    ]);
    await this.auditLog.record(actorId, 'UPDATE_BRAND', 'Brand', id, {
      from: existing.name,
      to: name,
      productsUpdated: products.count,
    });
    return brand;
  }

  async mergeBrands(actorId: string, sourceId: string, targetId: string) {
    if (sourceId === targetId) throw new BadRequestException('Elegí dos marcas distintas');
    const [source, target] = await Promise.all([
      this.prisma.brand.findUnique({ where: { id: sourceId } }),
      this.prisma.brand.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) throw new NotFoundException('Brand not found');
    const moved = await this.prisma.product.updateMany({
      where: { brandId: sourceId },
      data: { brandId: targetId, brand: target.name },
    });
    await this.prisma.brand.delete({ where: { id: sourceId } });
    await this.auditLog.record(actorId, 'MERGE_BRAND', 'Brand', sourceId, {
      source: source.name,
      target: target.name,
      targetId: target.id,
      productsMoved: moved.count,
    });
    return { merged: source.id, into: target.id, productsMoved: moved.count };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: category._count.products,
    }));
  }

  recordUpload(actorId: string, originalName: string) {
    return this.auditLog.record(actorId, 'UPLOAD_IMAGE', 'Storage', originalName, {
      originalName,
    });
  }

  private async createBrandRow(name: string, normalizedName: string): Promise<Brand> {
    try {
      return await this.prisma.brand.create({
        data: { name, slug: slugifyName(name), normalizedName },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.brand.findUnique({ where: { normalizedName } });
        if (raced) return raced;
      }
      throw error;
    }
  }

  private async createCategoryRow(name: string, normalizedName: string): Promise<Category> {
    try {
      const highest = await this.prisma.category.aggregate({ _max: { position: true } });
      return await this.prisma.category.create({
        data: {
          name,
          slug: slugifyName(name),
          normalizedName,
          position: (highest._max.position ?? 0) + 1,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.category.findUnique({ where: { normalizedName } });
        if (raced) return raced;
      }
      throw error;
    }
  }

  private async resolveBrand(brandId?: string, brandName?: string): Promise<Brand | null> {
    if (brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new BadRequestException('La marca indicada no existe');
      return brand;
    }
    const trimmed = cleanDisplayName(brandName ?? '');
    const normalizedName = normalizeName(trimmed);
    if (!normalizedName) return null;
    const existing = await this.prisma.brand.findUnique({ where: { normalizedName } });
    if (existing) return existing;
    return this.createBrandRow(trimmed, normalizedName);
  }

  private async resolveCategories(
    categoryIds?: string[],
    legacyName?: string,
  ): Promise<Category[]> {
    if (categoryIds !== undefined) {
      const unique = [...new Set(categoryIds)];
      if (unique.length !== categoryIds.length) {
        throw new BadRequestException('Las categorías tienen elementos repetidos');
      }
      if (unique.length > 2) {
        throw new BadRequestException('Cada producto puede tener hasta 2 categorías');
      }
      if (unique.length === 0) return [];
      const categories = await this.prisma.category.findMany({ where: { id: { in: unique } } });
      if (categories.length !== unique.length) {
        throw new BadRequestException('Alguna de las categorías elegidas no existe');
      }
      const byId = new Map(categories.map((category) => [category.id, category]));
      return unique.map((categoryId) => byId.get(categoryId) as Category);
    }
    const trimmed = cleanDisplayName(legacyName ?? '');
    const normalizedName = normalizeName(trimmed);
    if (!normalizedName || normalizedName === 'uncategorized') return [];
    const existing = await this.prisma.category.findUnique({ where: { normalizedName } });
    if (existing) return [existing];
    return [await this.createCategoryRow(trimmed, normalizedName)];
  }

  async addProductImage(actorId: string, productId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Enviá un archivo de imagen');
    if (!PRODUCT_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Formato no permitido: usá JPG, PNG o WebP');
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('La imagen no puede superar los 5 MB');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, brand: true, imageUrl: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const count = await this.prisma.productImage.count({ where: { productId } });
    if (count >= MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(`Cada producto puede tener hasta ${MAX_PRODUCT_IMAGES} fotos`);
    }

    const url = await this.storage.uploadImage(file.buffer, file.originalname, file.mimetype);
    const image = await this.prisma.productImage.create({
      data: { productId, url, position: count, alt: `${product.name} — ${product.brand}` },
    });
    if (!product.imageUrl) {
      await this.prisma.product.update({ where: { id: productId }, data: { imageUrl: url } });
    }

    await this.auditLog.record(actorId, 'UPLOAD_PRODUCT_IMAGE', 'Product', productId, {
      imageId: image.id,
      position: image.position,
      url,
    });
    return this.serializeImage(image);
  }

  async deleteProductImage(actorId: string, productId: string, imageId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) throw new NotFoundException('Image not found');

    const count = await this.prisma.productImage.count({ where: { productId } });
    if (count <= 1 && product.isActive) {
      throw new BadRequestException('Un producto publicado no puede quedarse sin fotos');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    await this.storage.deleteImage(image.url);
    const remaining = await this.resequenceProductImages(productId);
    await this.syncMainImageUrl(productId, remaining);
    await this.auditLog.record(actorId, 'DELETE_PRODUCT_IMAGE', 'Product', productId, {
      imageId,
      url: image.url,
    });
    return { id: imageId, deleted: true, images: remaining.map((item) => this.serializeImage(item)) };
  }

  async reorderProductImages(actorId: string, productId: string, imageIds: string[]) {
    const uniqueIds = [...new Set(imageIds)];
    if (uniqueIds.length !== imageIds.length) {
      throw new BadRequestException('La lista de fotos tiene elementos repetidos');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');

    const images = await this.prisma.productImage.findMany({ where: { productId } });
    if (images.length !== uniqueIds.length) {
      throw new BadRequestException('La lista debe incluir todas las fotos del producto');
    }
    const byId = new Map(images.map((image) => [image.id, image]));
    if (!uniqueIds.every((id) => byId.has(id))) {
      throw new BadRequestException('Alguna foto no pertenece a este producto');
    }

    if (uniqueIds.length > 0) {
      await this.prisma.$transaction(
        uniqueIds.map((id, index) =>
          this.prisma.productImage.update({ where: { id }, data: { position: index } }),
        ),
      );
    }
    const ordered = uniqueIds.map((id) => byId.get(id) as ProductImage);
    await this.syncMainImageUrl(productId, ordered);
    await this.auditLog.record(actorId, 'REORDER_PRODUCT_IMAGES', 'Product', productId, { imageIds: uniqueIds });
    return ordered.map((image, index) => this.serializeImage({ ...image, position: index }));
  }

  private async resequenceProductImages(productId: string): Promise<ProductImage[]> {
    const remaining = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    if (remaining.length > 0) {
      await this.prisma.$transaction(
        remaining.map((image, index) =>
          this.prisma.productImage.update({ where: { id: image.id }, data: { position: index } }),
        ),
      );
    }
    return remaining.map((image, index) => ({ ...image, position: index }));
  }

  private async syncMainImageUrl(productId: string, images: ProductImage[]) {
    await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: images[0]?.url ?? null },
    });
  }

  private serializeImage(image: ProductImage) {
    return { id: image.id, url: image.url, alt: image.alt, position: image.position };
  }

  async reorderFeaturedProducts(actorId: string, ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) {
      throw new BadRequestException('La lista de destacados tiene productos repetidos');
    }
    if (uniqueIds.length > 0) {
      const products = await this.prisma.product.findMany({ where: { id: { in: uniqueIds } } });
      if (products.length !== uniqueIds.length) {
        throw new BadRequestException('Algún producto de la lista no existe');
      }
      const invalid = products.find((product) => !product.isActive || product.stock <= 0);
      if (invalid) {
        throw new BadRequestException(
          `No se puede destacar "${invalid.name}" porque está inactivo o sin stock`,
        );
      }
    }
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { featured: true, id: { notIn: uniqueIds } },
        data: { featured: false },
      }),
      ...uniqueIds.map((productId, index) =>
        this.prisma.product.update({
          where: { id: productId },
          data: { featured: true, featuredOrder: index + 1 },
        }),
      ),
    ]);
    await this.auditLog.record(actorId, 'REORDER_FEATURED_PRODUCTS', 'Product', 'featured', { ids: uniqueIds });
    return { featured: uniqueIds };
  }

  async getHomeHero() {
    const hero = await this.prisma.homeHero.findUnique({
      where: { id: 'home' },
      include: {
        product: {
          select: {
            id: true, slug: true, name: true, brand: true, price: true,
            imageUrl: true, isActive: true, stock: true,
          },
        },
      },
    });
    return {
      productId: hero?.productId ?? null,
      imageUrl: hero?.imageUrl ?? null,
      title: hero?.title ?? null,
      subtitle: hero?.subtitle ?? null,
      buttonLabel: hero?.buttonLabel ?? null,
      product: hero?.product ? { ...hero.product, price: hero.product.price.toString() } : null,
    };
  }

  async updateHomeHero(actorId: string, dto: UpdateHomeHeroDto) {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, isActive: true },
      });
      if (!product || !product.isActive) {
        throw new BadRequestException('El producto elegido no existe o está inactivo');
      }
    }

    const cleanText = (value: string | null | undefined) => {
      const trimmed = (value ?? '').trim();
      return trimmed === '' ? null : trimmed;
    };

    const changes: Prisma.HomeHeroUncheckedUpdateInput = {};
    if (dto.productId !== undefined) changes.productId = dto.productId || null;
    if (dto.imageUrl !== undefined) changes.imageUrl = cleanText(dto.imageUrl);
    if (dto.title !== undefined) changes.title = cleanText(dto.title);
    if (dto.subtitle !== undefined) changes.subtitle = cleanText(dto.subtitle);
    if (dto.buttonLabel !== undefined) changes.buttonLabel = cleanText(dto.buttonLabel);

    await this.prisma.homeHero.upsert({
      where: { id: 'home' },
      create: {
        id: 'home',
        productId: (changes.productId as string | null) ?? null,
        imageUrl: (changes.imageUrl as string | null) ?? null,
        title: (changes.title as string | null) ?? null,
        subtitle: (changes.subtitle as string | null) ?? null,
        buttonLabel: (changes.buttonLabel as string | null) ?? null,
      },
      update: changes,
    });
    await this.auditLog.record(actorId, 'UPDATE_HOME_HERO', 'HomeHero', 'home', { fields: Object.keys(changes) });
    return this.getHomeHero();
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


