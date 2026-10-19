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
  const productImage = {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const homeHero = { findUnique: jest.fn(), upsert: jest.fn() };
  const auditLog = { record: jest.fn() };
  const storage = { uploadImage: jest.fn(), deleteImage: jest.fn(), remoteEnabled: false };
  const prisma = {
    product,
    productImage,
    homeHero,
    $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    product.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...baseProduct(),
      ...data,
    }));
    service = new AdminService(prisma as never, auditLog as never, storage as never);
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

  function fakeImageFile(overrides: Partial<Express.Multer.File> = {}) {
    return {
      buffer: Buffer.from('fake'),
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      ...overrides,
    } as Express.Multer.File;
  }

  it('rechaza imágenes que no sean JPG, PNG o WebP', async () => {
    await expect(
      service.addProductImage('admin1', 'p1', fakeImageFile({ mimetype: 'image/gif' })),
    ).rejects.toThrow(BadRequestException);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('rechaza subir cuando el producto ya tiene 8 fotos', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1', name: 'X', brand: 'Y', imageUrl: null });
    productImage.count.mockResolvedValue(8);

    await expect(service.addProductImage('admin1', 'p1', fakeImageFile())).rejects.toThrow(BadRequestException);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('sube la foto al final y audita UPLOAD_PRODUCT_IMAGE', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1', name: 'N', brand: 'B', imageUrl: null });
    productImage.count.mockResolvedValue(2);
    storage.uploadImage.mockResolvedValue('https://cdn.test/foto.jpg');
    productImage.create.mockResolvedValue({ id: 'i3', url: 'https://cdn.test/foto.jpg', alt: 'N — B', position: 2 });

    const result = await service.addProductImage('admin1', 'p1', fakeImageFile());

    expect(productImage.create).toHaveBeenCalledWith({
      data: { productId: 'p1', url: 'https://cdn.test/foto.jpg', position: 2, alt: 'N — B' },
    });
    expect(product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { imageUrl: 'https://cdn.test/foto.jpg' } });
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'UPLOAD_PRODUCT_IMAGE', 'Product', 'p1', expect.anything());
    expect(result).toEqual({ id: 'i3', url: 'https://cdn.test/foto.jpg', alt: 'N — B', position: 2 });
  });

  it('no permite dejar sin fotos a un producto publicado', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1', isActive: true });
    productImage.findUnique.mockResolvedValue({ id: 'i1', productId: 'p1', url: 'u1' });
    productImage.count.mockResolvedValue(1);

    await expect(service.deleteProductImage('admin1', 'p1', 'i1')).rejects.toThrow(BadRequestException);
    expect(productImage.delete).not.toHaveBeenCalled();
  });

  it('borra la foto, reordena posiciones y audita', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1', isActive: true });
    productImage.findUnique.mockResolvedValue({ id: 'i1', productId: 'p1', url: 'u1' });
    productImage.count.mockResolvedValue(2);
    productImage.findMany.mockResolvedValue([{ id: 'i2', productId: 'p1', url: 'u2', position: 1, alt: null }]);

    const result = await service.deleteProductImage('admin1', 'p1', 'i1');

    expect(productImage.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    expect(storage.deleteImage).toHaveBeenCalledWith('u1');
    expect(product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { imageUrl: 'u2' } });
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'DELETE_PRODUCT_IMAGE', 'Product', 'p1', expect.anything());
    expect(result).toEqual({ id: 'i1', deleted: true, images: [{ id: 'i2', url: 'u2', alt: null, position: 0 }] });
  });

  it('rechaza reordenar con fotos ajenas al producto', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1' });
    productImage.findMany.mockResolvedValue([
      { id: 'i1', productId: 'p1', url: 'u1', position: 0, alt: null },
      { id: 'i2', productId: 'p1', url: 'u2', position: 1, alt: null },
    ]);

    await expect(service.reorderProductImages('admin1', 'p1', ['i1', 'iX'])).rejects.toThrow(BadRequestException);
  });

  it('reordena todas las fotos, sincroniza la principal y audita', async () => {
    product.findUnique.mockResolvedValue({ id: 'p1' });
    productImage.findMany.mockResolvedValue([
      { id: 'i1', productId: 'p1', url: 'u1', position: 0, alt: null },
      { id: 'i2', productId: 'p1', url: 'u2', position: 1, alt: null },
    ]);
    productImage.update.mockResolvedValue({});

    const result = await service.reorderProductImages('admin1', 'p1', ['i2', 'i1']);

    expect(productImage.update).toHaveBeenCalledWith({ where: { id: 'i2' }, data: { position: 0 } });
    expect(productImage.update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { position: 1 } });
    expect(product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { imageUrl: 'u2' } });
    expect(auditLog.record).toHaveBeenCalledWith('admin1', 'REORDER_PRODUCT_IMAGES', 'Product', 'p1', {
      imageIds: ['i2', 'i1'],
    });
    expect(result.map((image) => image.id)).toEqual(['i2', 'i1']);
  });
});
