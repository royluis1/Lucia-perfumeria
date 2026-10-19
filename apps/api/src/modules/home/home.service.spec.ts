jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import { HomeService } from './home.service';

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    slug: 'black-opium',
    name: 'Black Opium',
    brand: 'YSL',
    description: 'desc',
    price: '12500.00',
    weightGrams: 100,
    category: 'Florales',
    imageUrl: '/uploads/products/a.png',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('HomeService', () => {
  const homeHero = { findUnique: jest.fn() };
  const product = { findMany: jest.fn() };
  const prisma = { homeHero, product } as unknown as import('../../prisma/prisma.service').PrismaService;
  let service: HomeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HomeService(prisma);
  });

  it('devuelve destacados con price string y categorías del catálogo', async () => {
    homeHero.findUnique.mockResolvedValue(null);
    product.findMany
      .mockResolvedValueOnce([productRow()])
      .mockResolvedValueOnce([{ category: 'Florales' }, { category: 'Citricos' }]);

    const result = await service.getHome();

    expect(result.featured).toHaveLength(1);
    expect(result.featured[0].price).toBe('12500.00');
    expect(result.categories).toEqual(['Florales', 'Citricos']);
    expect(product.findMany).toHaveBeenCalledTimes(2);
  });

  it('consulta destacados activos con stock ordenados por featuredOrder', async () => {
    homeHero.findUnique.mockResolvedValue(null);
    product.findMany.mockResolvedValue([]);

    await service.getHome();

    const featuredCall = product.findMany.mock.calls[0][0];
    expect(featuredCall.where).toEqual({ isActive: true, stock: { gt: 0 }, featured: true });
    expect(featuredCall.orderBy).toEqual([{ featuredOrder: 'asc' }, { createdAt: 'desc' }]);
  });

  it('usa los últimos productos como respaldo si no hay destacados', async () => {
    homeHero.findUnique.mockResolvedValue(null);
    product.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([productRow({ id: 'p2', name: 'Nuevo' })]);

    const result = await service.getHome();

    expect(product.findMany).toHaveBeenCalledTimes(3);
    const fallbackCall = product.findMany.mock.calls[2][0];
    expect(fallbackCall.take).toBe(3);
    expect(fallbackCall.orderBy).toEqual({ createdAt: 'desc' });
    expect(result.featured[0]).toMatchObject({ id: 'p2', name: 'Nuevo' });
  });

  it('usa la imagen del producto como imagen del hero si no hay override', async () => {
    homeHero.findUnique.mockResolvedValue({
      id: 'home',
      productId: 'p1',
      imageUrl: null,
      title: null,
      subtitle: null,
      buttonLabel: null,
      product: productRow(),
    });
    product.findMany.mockResolvedValue([]);

    const result = await service.getHome();

    expect(result.hero.imageUrl).toBe('/uploads/products/a.png');
    expect(result.hero.product?.name).toBe('Black Opium');
    expect(result.hero.title).toBeNull();
  });

  it('prioriza el override de imagen y los textos configurados', async () => {
    homeHero.findUnique.mockResolvedValue({
      id: 'home',
      productId: 'p1',
      imageUrl: '/uploads/hero/x.png',
      title: 'Título propio',
      subtitle: 'Subtítulo propio',
      buttonLabel: 'Ver más',
      product: productRow(),
    });
    product.findMany.mockResolvedValue([]);

    const result = await service.getHome();

    expect(result.hero).toMatchObject({
      imageUrl: '/uploads/hero/x.png',
      title: 'Título propio',
      subtitle: 'Subtítulo propio',
      buttonLabel: 'Ver más',
    });
  });

  it('devuelve hero vacío cuando no hay configuración', async () => {
    homeHero.findUnique.mockResolvedValue(null);
    product.findMany.mockResolvedValue([]);

    const result = await service.getHome();

    expect(result.hero).toEqual({ product: null, imageUrl: null, title: null, subtitle: null, buttonLabel: null });
    expect(result.featured).toEqual([]);
  });
});
