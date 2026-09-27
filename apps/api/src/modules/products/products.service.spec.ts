import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const product = {
    id: 'p1',
    slug: 'eau-de-parfum',
    name: 'Eau de Parfum',
    brand: 'Niche',
    description: 'desc',
    price: '12500.00',
    weightGrams: 100,
    category: 'Florales',
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    product: {
      findMany: jest.fn().mockResolvedValue([product]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma as any);
  });

  it('convierte price a string en la respuesta', async () => {
    const result = await service.findAll({});
    expect(result.data[0].price).toBe('12500.00');
  });

  it('filtra por categoria pasandola al where', async () => {
    await service.findAll({ category: 'Citricos' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'Citricos', isActive: true }),
      }),
    );
  });

  it('ordena por precio ascendente con sort=price_asc', async () => {
    await service.findAll({ sort: 'price_asc' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { price: 'asc' } }),
    );
  });

  it('lanza NotFoundException si el slug no existe', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.findBySlug('no-existe')).rejects.toThrow(NotFoundException);
  });

  it('rechaza limit mayor a 100', async () => {
    await expect(service.findAll({ limit: '999' })).rejects.toThrow(BadRequestException);
  });
});