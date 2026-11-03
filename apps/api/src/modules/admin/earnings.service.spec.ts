jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import { BadRequestException } from '@nestjs/common';
import { EarningsService } from './earnings.service';

describe('EarningsService', () => {
  const order = {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  const orderItem = { aggregate: jest.fn() };
  const prisma = {
    order,
    orderItem,
    $queryRaw: jest.fn(),
  };
  let service: EarningsService;

  beforeEach(() => {
    jest.clearAllMocks();
    order.aggregate
      .mockResolvedValueOnce({
        _count: { _all: 2 },
        _sum: { total: 13000 },
        _avg: { total: 6500 },
      })
      .mockResolvedValueOnce({
        _count: { _all: 1 },
        _sum: { total: 5000 },
      });
    order.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    orderItem.aggregate.mockResolvedValueOnce({ _sum: { quantity: 4 } }).mockResolvedValueOnce({ _sum: { quantity: 2 } });
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { bucketStart: new Date('2026-10-01T03:00:00.000Z'), sales: 2, revenue: '13000' },
      ])
      .mockResolvedValueOnce([
        { id: 'p1', name: 'Perfume', imageUrl: null, unitsSold: 4n, revenue: '13000' },
      ])
      .mockResolvedValueOnce([
        { id: 'p1', name: 'Perfume', imageUrl: null, unitsSold: 4n, revenue: '13000' },
      ]);
    order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        createdAt: new Date('2026-10-01T13:00:00.000Z'),
        subtotal: { toString: () => '12000' },
        shippingCost: { toString: () => '1000' },
        total: { toString: () => '13000' },
        status: 'CONFIRMED',
        paymentStatus: 'APPROVED',
        user: { name: 'Cliente', email: 'cliente@example.com' },
        paymentPreference: { sandbox: false },
        items: [{ quantity: 2, product: { name: 'Perfume' } }],
      },
    ]);
    service = new EarningsService(prisma as never);
  });

  it('calcula ventas cobradas, unidades, ticket y comparativo sin inventar ganancias ni reembolsos', async () => {
    const report = await service.getReport({
      period: 'custom',
      from: '2026-10-01',
      to: '2026-10-01',
    });

    expect(report.summary).toMatchObject({
      completedSales: 2,
      collectedTotal: 13000,
      unitsSold: 4,
      averageTicket: 6500,
      pendingOrders: 3,
      refundedOrders: 1,
      refundedAmount: null,
      returnedUnits: null,
      netProfit: null,
      comparison: { completedSales: 100, collectedTotal: 160 },
      limitations: {
        costsRecorded: false,
        operationalExpensesRecorded: false,
        partialRefundsRecorded: false,
        productReturnsRecorded: false,
        discountsRecorded: false,
      },
    });
    expect(report.paymentMethods).toEqual([{ method: 'Mercado Pago', sales: 2, amount: 13000 }]);
    expect(report.products.byUnits[0]).toMatchObject({ id: 'p1', unitsSold: 4, revenue: 13000 });
    expect(report.orders.data[0]).toMatchObject({
      customer: 'Cliente',
      itemCount: 2,
      paymentMethod: 'Mercado Pago',
      total: '13000',
    });
  });

  it('rechaza fechas personalizadas inválidas antes de consultar la base', async () => {
    await expect(
      service.getReport({ period: 'custom', from: '2026-02-31', to: '2026-03-01' }),
    ).rejects.toThrow(BadRequestException);
    expect(order.aggregate).not.toHaveBeenCalled();
  });

  it('rechaza estados que no existen en el enum de pedidos', async () => {
    await expect(
      service.getReport({ period: 'custom', from: '2026-10-01', to: '2026-10-02', status: 'UNKNOWN' }),
    ).rejects.toThrow(BadRequestException);
    expect(order.aggregate).not.toHaveBeenCalled();
  });

  it('aplica los límites del período y excluye pagos no aprobados de las ventas cobradas', async () => {
    await service.getReport({ period: 'custom', from: '2026-10-01', to: '2026-10-02' });

    expect(order.aggregate).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        createdAt: {
          gte: new Date('2026-10-01T03:00:00.000Z'),
          lt: new Date('2026-10-03T03:00:00.000Z'),
        },
        paymentStatus: 'APPROVED',
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        paymentPreference: { is: { sandbox: false } },
      }),
      _count: { _all: true },
      _sum: { total: true },
      _avg: { total: true },
    });
  });
});
