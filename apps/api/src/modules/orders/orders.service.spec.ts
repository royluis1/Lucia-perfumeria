jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const cart = { findUnique: jest.fn() };
  const cartItem = { deleteMany: jest.fn() };
  const order = { create: jest.fn(), delete: jest.fn() };
  const product = { updateMany: jest.fn(), update: jest.fn() };
  const user = { findUnique: jest.fn() };
  const prisma = {
    cart,
    cartItem,
    order,
    product,
    user,
    $transaction: jest.fn(),
  };
  const shippingService = { quote: jest.fn() };
  const mailService = { send: jest.fn().mockResolvedValue(undefined) };
  const paymentsService = { createPreference: jest.fn() };
  let service: OrdersService;

  const address = {
    recipient: 'Cliente',
    street: 'Calle 1',
    city: 'Villa Mercedes',
    state: 'San Luis',
    postalCode: '5730',
    phone: '2664000000',
    country: 'Argentina',
  };

  const createdOrder = {
    id: 'order-1',
    userId: 'user-1',
    subtotal: new Prisma.Decimal('95.00'),
    shippingCost: new Prisma.Decimal('100.00'),
    total: new Prisma.Decimal('195.00'),
    shippingAddress: address,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'product-1',
        quantity: 2,
        unitPrice: new Prisma.Decimal('47.50'),
        subtotal: new Prisma.Decimal('95.00'),
        product: { id: 'product-1', slug: 'perfume', name: 'Perfume', brand: 'Marca', sku: 'SKU-1' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: (client: typeof prisma) => unknown) => fn(prisma));
    cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'ci-1',
          productId: 'product-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Perfume',
            isActive: true,
            price: new Prisma.Decimal('47.50'),
            weightGrams: 300,
          },
        },
      ],
    });
    product.updateMany.mockResolvedValue({ count: 1 });
    shippingService.quote.mockReturnValue({ cost: 100, estimatedDays: 4, zone: 'interior-lejano', pickup: false });
    order.create.mockResolvedValue(createdOrder);
    user.findUnique.mockResolvedValue({ email: 'cliente@example.com', name: 'Cliente' });
    service = new OrdersService(
      prisma as never,
      shippingService as never,
      mailService as never,
      paymentsService as never,
    );
  });

  it('createWithPayment crea el pago, vacía el carrito y devuelve el checkoutUrl', async () => {
    paymentsService.createPreference.mockResolvedValue({
      id: 'pref-1',
      checkoutUrl: 'https://mp/checkout',
      sandbox: false,
    });

    const result = await service.createWithPayment('user-1', address as never);

    expect(result.checkoutUrl).toBe('https://mp/checkout');
    expect(result.order.total).toBe('195');
    expect(cartItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(order.delete).not.toHaveBeenCalled();
    await new Promise((resolve) => setImmediate(resolve));
    expect(mailService.send).toHaveBeenCalled();
  });

  it('si Mercado Pago falla, revierte la orden, restaura stock y conserva el carrito', async () => {
    paymentsService.createPreference.mockRejectedValue(
      new ServiceUnavailableException('No se pudo iniciar el checkout de Mercado Pago'),
    );

    await expect(service.createWithPayment('user-1', address as never)).rejects.toThrow(
      /carrito quedó intacto/,
    );

    expect(order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
    expect(product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stock: { increment: 2 } },
    });
    expect(cartItem.deleteMany).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('si los pagos no están configurados, revierte y avisa sin tocar el carrito', async () => {
    paymentsService.createPreference.mockResolvedValue({ id: 'pref-1', status: 'pending' });

    await expect(service.createWithPayment('user-1', address as never)).rejects.toThrow(
      /no están configurados/,
    );

    expect(order.delete).toHaveBeenCalled();
    expect(cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('si el rollback falla, avisa que el pedido quedó pendiente', async () => {
    paymentsService.createPreference.mockRejectedValue(new ServiceUnavailableException('boom'));
    order.delete.mockRejectedValue(new Error('db caída'));

    await expect(service.createWithPayment('user-1', address as never)).rejects.toThrow(
      /quedó pendiente/,
    );
  });

  it('create conserva el comportamiento original (vacía el carrito en la transacción)', async () => {
    const result = await service.create('user-1', address as never);

    expect(result.total).toBe('195');
    expect(cartItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(paymentsService.createPreference).not.toHaveBeenCalled();
  });

  it('rechaza crear una orden con carrito vacío', async () => {
    cart.findUnique.mockResolvedValue(null);

    await expect(service.createWithPayment('user-1', address as never)).rejects.toThrow(
      BadRequestException,
    );
    expect(order.create).not.toHaveBeenCalled();
  });
});
