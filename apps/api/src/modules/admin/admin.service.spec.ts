jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';

function baseProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    slug: 'black-opium',
    name: 'Black Opium',
    brand: 'YSL',
    description: 'desc',
    price: '100.00',
    stock: 5,
    sku: 'SKU1',
    isActive: true,
    weightGrams: 100,
    category: 'Florales',
    imageUrl: null,
    featured: false,
    featuredOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('AdminService destacados y hero', () => {
  let service: AdminService;
  const product = {
    findUnique: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  };
  const homeHero = { findUnique: jest.fn(), upsert: jest.fn() };
  const auditLog = { record: jest.fn() };
  const prisma = {
    product,
    homeHero,
    $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    product.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...baseProduct(),
      ...data,
    }));
    service = new AdminService(prisma as never, auditLog as never);
  });

  it('rechaza destacar un producto inactivo', async () => {
    product.findUnique.mockResolvedValue(baseProduct({ isActive: false }));

    await expect(service.updateProduct('admin1', 'p1', { featured: true })).rejects.toThrow(BadRequestException);
    expect(product.update).not.toHaveBeenCalled();
  });

  it('rechaza destacar un producto sin stock', async () => {
    product.findUnique.mockResolvedValue(baseProduct({ stock: 0 }));

    await expect(service.updateProduct('admin1', 'p1', { featured: true })).rejects.toThrow(BadRequestException);
    expect(product.update).not.toHaveBeenCalled();
  });

  it('lanza NotFound si el producto no existe', async () => {
    product.findUnique.mockResolvedValue(null);

    await expect(service.updateProduct('admin1', 'nope', { name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('asigna el siguiente orden al destacar y audita FEATURE_PRODUCT', async () => {
    product.findUnique.mockResolvedValue(baseProduct());
    product.aggregate.mockResolvedValue({ _max: { featuredOrder: 3 } });

    await service.updateProduct('admin1', 'p1', { featured: true });

    expect(product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ featured: true, featuredOrder: 4 }) }),
    );
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'FEATURE_PRODUCT', 'Product', 'p1', expect.anything());
  });

  it('audita UNFEATURE_PRODUCT al quitar el destacado', async () => {
    product.findUnique.mockResolvedValue(baseProduct({ featured: true, featuredOrder: 1 }));

    await service.updateProduct('admin1', 'p1', { featured: false });

    expect(product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ featured: false }) }),
    );
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'UNFEATURE_PRODUCT', 'Product', 'p1', expect.anything());
  });

  it('quita de destacados al desactivar un producto destacado', async () => {
    product.findUnique.mockResolvedValue(baseProduct({ featured: true, featuredOrder: 2 }));

    await service.updateProduct('admin1', 'p1', { isActive: false });

    expect(product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isActive: false, featured: false }) }),
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      'admin1',
      'UPDATE_PRODUCT',
      'Product',
      'p1',
      expect.objectContaining({ unfeaturedByDeactivation: true }),
    );
  });

  it('deactivateProduct quita el destacado y lo informa en auditoría', async () => {
    product.findUnique.mockResolvedValue(baseProduct({ featured: true, featuredOrder: 1 }));

    await service.deactivateProduct('admin1', 'p1');

    expect(product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false, featured: false } }),
    );
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'DEACTIVATE_PRODUCT', 'Product', 'p1', {
      unfeatured: true,
    });
  });

  it('rechaza listas de orden con repetidos', async () => {
    await expect(service.reorderFeaturedProducts('admin1', ['p1', 'p1'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza listas con productos inexistentes', async () => {
    product.findMany.mockResolvedValue([baseProduct()]);

    await expect(service.reorderFeaturedProducts('admin1', ['p1', 'p2'])).rejects.toThrow(BadRequestException);
  });

  it('rechaza reordenar con productos inactivos o sin stock', async () => {
    product.findMany.mockResolvedValue([baseProduct({ id: 'p1', stock: 0 })]);

    await expect(service.reorderFeaturedProducts('admin1', ['p1'])).rejects.toThrow(BadRequestException);
  });

  it('aplica el nuevo orden en transacción y audita REORDER_FEATURED_PRODUCTS', async () => {
    product.findMany.mockResolvedValue([baseProduct({ id: 'p1' }), baseProduct({ id: 'p2' })]);
    product.updateMany.mockResolvedValue({ count: 0 });
    product.update.mockResolvedValue(baseProduct());

    const result = await service.reorderFeaturedProducts('admin1', ['p2', 'p1']);

    expect(product.updateMany).toHaveBeenCalledWith({
      where: { featured: true, id: { notIn: ['p2', 'p1'] } },
      data: { featured: false },
    });
    expect(product.update).toHaveBeenCalledWith({
      where: { id: 'p2' },
      data: { featured: true, featuredOrder: 1 },
    });
    expect(product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { featured: true, featuredOrder: 2 },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditLog.record).toHaveBeenCalledWith(
      'admin1',
      'REORDER_FEATURED_PRODUCTS',
      'Product',
      'featured',
      { ids: ['p2', 'p1'] },
    );
    expect(result).toEqual({ featured: ['p2', 'p1'] });
  });

  it('rechaza un hero con producto inexistente o inactivo', async () => {
    product.findUnique.mockResolvedValue(null);

    await expect(service.updateHomeHero('admin1', { productId: 'p1' })).rejects.toThrow(BadRequestException);

    product.findUnique.mockResolvedValue({ id: 'p1', isActive: false });

    await expect(service.updateHomeHero('admin1', { productId: 'p1' })).rejects.toThrow(BadRequestException);
    expect(homeHero.upsert).not.toHaveBeenCalled();
  });

  it('guarda el hero normalizando textos vacíos a null y audita', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1', isActive: true });
    homeHero.upsert.mockResolvedValue({ id: 'home' });
    homeHero.findUnique.mockResolvedValue(null);

    await service.updateHomeHero('admin1', { productId: 'p1', title: '  ', subtitle: 'Hola', buttonLabel: '' });

    expect(homeHero.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'home' },
        update: { productId: 'p1', title: null, subtitle: 'Hola', buttonLabel: null },
      }),
    );
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'UPDATE_HOME_HERO', 'HomeHero', 'home', expect.anything());
  });
});
