import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Readable } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';

export type EarningsPeriod =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

type DateRange = { start: Date; end: Date; startDate: string; endDate: string };
type TrendRow = { bucketStart: Date; sales: number; revenue: string };
type ProductRow = { id: string; name: string; imageUrl: string | null; unitsSold: bigint; revenue: string };

const TIME_ZONE = 'America/Argentina/Buenos_Aires';
const PAGE_SIZE = 25;

function localDateString(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: 'year' | 'month' | 'day') => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function startOfWeek(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return shiftDate(date, -(day === 0 ? 6 : day - 1));
}

function utcStartOfLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 3));
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function makeRange(startDate: string, endDate: string): DateRange {
  return {
    startDate,
    endDate,
    start: utcStartOfLocalDate(startDate),
    end: utcStartOfLocalDate(shiftDate(endDate, 1)),
  };
}

function getRange(period: EarningsPeriod, from?: string, to?: string, now = new Date()): DateRange {
  const today = localDateString(now);
  let startDate: string;
  let endDate: string;

  switch (period) {
    case 'today':
      startDate = today;
      endDate = today;
      break;
    case 'yesterday':
      startDate = shiftDate(today, -1);
      endDate = startDate;
      break;
    case 'last7':
      startDate = shiftDate(today, -6);
      endDate = today;
      break;
    case 'last30':
      startDate = shiftDate(today, -29);
      endDate = today;
      break;
    case 'thisWeek':
      startDate = startOfWeek(today);
      endDate = today;
      break;
    case 'thisMonth':
      startDate = monthStart(today);
      endDate = today;
      break;
    case 'lastMonth': {
      const currentMonthStart = monthStart(today);
      endDate = shiftDate(currentMonthStart, -1);
      startDate = monthStart(endDate);
      break;
    }
    case 'thisYear':
      startDate = `${today.slice(0, 4)}-01-01`;
      endDate = today;
      break;
    case 'custom':
      if (!from || !to || !isIsoDate(from) || !isIsoDate(to) || from > to) {
        throw new BadRequestException('Seleccioná un rango de fechas válido.');
      }
      startDate = from;
      endDate = to;
      break;
    default:
      throw new BadRequestException('El período solicitado no es válido.');
  }

  return makeRange(startDate, endDate);
}

function previousRange(range: DateRange): DateRange {
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(`${range.endDate}T00:00:00.000Z`) - Date.parse(`${range.startDate}T00:00:00.000Z`)) /
        86_400_000,
    ) + 1,
  );
  const previousEnd = shiftDate(range.startDate, -1);
  return makeRange(shiftDate(previousEnd, -(days - 1)), previousEnd);
}

function csvCell(value: string | number | null | undefined) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(input: {
    period?: string;
    from?: string;
    to?: string;
    page?: number;
    status?: string;
    search?: string;
  }) {
    const period = (input.period || 'last30') as EarningsPeriod;
    const range = getRange(period, input.from, input.to);
    const previous = previousRange(range);
    const paidWhere = this.paidOrdersWhere(range);
    const previousPaidWhere = this.paidOrdersWhere(previous);
    const page = Number.isFinite(input.page) && Number(input.page) > 0 ? Math.floor(Number(input.page)) : 1;
    const status = input.status?.trim();
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('El estado de pedido no es válido.');
    }
    const search = input.search?.trim().slice(0, 100);
    const orderWhere: Prisma.OrderWhereInput = {
      createdAt: { gte: range.start, lt: range.end },
      ...(status ? { status: status as OrderStatus } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [
      current,
      prior,
      pendingOrders,
      refundedOrders,
      soldUnits,
      priorSoldUnits,
      trend,
      topProductsByUnits,
      topProductsByRevenue,
      orderCount,
      orders,
    ] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: paidWhere,
          _count: { _all: true },
          _sum: { total: true },
          _avg: { total: true },
        }),
        this.prisma.order.aggregate({
          where: previousPaidWhere,
          _count: { _all: true },
          _sum: { total: true },
        }),
        this.prisma.order.count({
          where: {
            createdAt: { gte: range.start, lt: range.end },
            OR: [{ status: OrderStatus.PENDING }, { paymentStatus: PaymentStatus.PENDING }],
          },
        }),
        this.prisma.order.count({
          where: { createdAt: { gte: range.start, lt: range.end }, paymentStatus: PaymentStatus.REFUNDED },
        }),
        this.prisma.orderItem.aggregate({ where: { order: paidWhere }, _sum: { quantity: true } }),
        this.prisma.orderItem.aggregate({ where: { order: previousPaidWhere }, _sum: { quantity: true } }),
        this.getTrend(range),
        this.getProductRanking(range, 'units'),
        this.getProductRanking(range, 'revenue'),
        this.prisma.order.count({ where: orderWhere }),
        this.prisma.order.findMany({
          where: orderWhere,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            createdAt: true,
            subtotal: true,
            shippingCost: true,
            total: true,
            status: true,
            paymentStatus: true,
            user: { select: { name: true, email: true } },
            paymentPreference: { select: { sandbox: true } },
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                subtotal: true,
                product: { select: { name: true } },
              },
            },
          },
        }),
      ]);

    const trendRows = trend as TrendRow[];
    const salesByBucket = new Map(
      trendRows.map((row) => [this.bucketKey(row.bucketStart, this.bucketFor(range)), row]),
    );
    const series = this.buildSeries(range, salesByBucket);
    const currentRevenue = Number(current._sum.total ?? 0);
    const previousRevenue = Number(prior._sum.total ?? 0);
    const currentSales = current._count._all;
    const previousSales = prior._count._all;
    const units = soldUnits._sum.quantity ?? 0;
    const topRows = [...(topProductsByUnits as ProductRow[]), ...(topProductsByRevenue as ProductRow[])];
    const productMap = new Map<string, { id: string; name: string; imageUrl: string | null; unitsSold: number; revenue: number }>();
    for (const row of topRows) {
      const product = productMap.get(row.id) ?? {
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl,
        unitsSold: 0,
        revenue: 0,
      };
      product.unitsSold = Math.max(product.unitsSold, Number(row.unitsSold));
      product.revenue = Math.max(product.revenue, Number(row.revenue));
      productMap.set(row.id, product);
    }

    return {
      period,
      range: { from: range.startDate, to: range.endDate },
      summary: {
        completedSales: currentSales,
        collectedTotal: currentRevenue,
        unitsSold: units,
        averageTicket: currentSales ? Number(current._avg.total ?? 0) : 0,
        pendingOrders,
        refundedOrders,
        refundedAmount: null,
        returnedUnits: null,
        netProfit: null,
        currency: 'ARS',
        previous: {
          completedSales: previousSales,
          collectedTotal: previousRevenue,
          unitsSold: priorSoldUnits._sum.quantity ?? 0,
        },
        comparison: {
          completedSales: this.percentageChange(currentSales, previousSales),
          collectedTotal: this.percentageChange(currentRevenue, previousRevenue),
        },
        limitations: {
          costsRecorded: false,
          operationalExpensesRecorded: false,
          partialRefundsRecorded: false,
          productReturnsRecorded: false,
          discountsRecorded: false,
          message:
            'No hay costos de compra, gastos, descuentos ni detalle de devoluciones registrados. La facturación cobrada no representa ganancia neta.',
        },
      },
      paymentMethods: currentSales
        ? [{ method: 'Mercado Pago', sales: currentSales, amount: currentRevenue }]
        : [],
      trend: series,
      products: {
        byUnits: [...productMap.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10),
        byRevenue: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      },
      orders: {
        data: orders.map((order) => ({
          id: order.id,
          createdAt: order.createdAt,
          customer: order.user.name || order.user.email,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          items: order.items.map((item) => `${item.quantity} × ${item.product.name}`).join(', '),
          subtotal: order.subtotal.toString(),
          shippingCost: order.shippingCost.toString(),
          total: order.total.toString(),
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentPreference
            ? order.paymentPreference.sandbox
              ? 'Mercado Pago (prueba)'
              : 'Mercado Pago'
            : 'No registrado',
        })),
        page,
        pageSize: PAGE_SIZE,
        total: orderCount,
        totalPages: Math.ceil(orderCount / PAGE_SIZE),
      },
      returns: {
        available: false,
        message: 'El sistema no registra devoluciones de productos ni reembolsos parciales.',
      },
    };
  }

  async exportCsv(input: { period?: string; from?: string; to?: string }) {
    const range = getRange((input.period || 'last30') as EarningsPeriod, input.from, input.to);
    const stream = Readable.from(this.csvRows({ createdAt: { gte: range.start, lt: range.end } }));
    return new StreamableFile(stream, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="ganancias-${range.startDate}-${range.endDate}.csv"`,
    });
  }

  private paidOrdersWhere(range: DateRange): Prisma.OrderWhereInput {
    return {
      createdAt: { gte: range.start, lt: range.end },
      paymentStatus: PaymentStatus.APPROVED,
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
      paymentPreference: { is: { sandbox: false } },
    };
  }

  private percentageChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private bucketFor(range: DateRange): 'day' | 'month' {
    const days =
      (Date.parse(`${range.endDate}T00:00:00.000Z`) - Date.parse(`${range.startDate}T00:00:00.000Z`)) /
        86_400_000 +
      1;
    return days > 62 ? 'month' : 'day';
  }

  private bucketKey(date: Date, bucket: 'day' | 'month') {
    const day = localDateString(date);
    return bucket === 'month' ? day.slice(0, 7) : day;
  }

  private async getTrend(range: DateRange) {
    const bucket = this.bucketFor(range);
    return this.prisma.$queryRaw<TrendRow[]>`
      SELECT
        date_trunc(${bucket}, o."createdAt" + INTERVAL '3 hours') - INTERVAL '3 hours' AS "bucketStart",
        COUNT(*)::int AS "sales",
        COALESCE(SUM(o."total"), 0)::text AS "revenue"
      FROM "Order" o
      JOIN "PaymentPreference" pp ON pp."orderId" = o."id"
      WHERE o."createdAt" >= ${range.start}
        AND o."createdAt" < ${range.end}
        AND o."paymentStatus" = 'APPROVED'::"PaymentStatus"
        AND pp."sandbox" = false
        AND o."status" NOT IN ('CANCELLED'::"OrderStatus", 'REFUNDED'::"OrderStatus")
      GROUP BY 1
      ORDER BY 1
    `;
  }

  private buildSeries(range: DateRange, rows: Map<string, TrendRow>) {
    const bucket = this.bucketFor(range);
    const points: Array<{ date: string; sales: number; revenue: number }> = [];
    if (bucket === 'month') {
      let month = range.startDate.slice(0, 7);
      const finalMonth = range.endDate.slice(0, 7);
      while (month <= finalMonth) {
        const row = rows.get(month);
        points.push({ date: month, sales: row?.sales ?? 0, revenue: Number(row?.revenue ?? 0) });
        const next = new Date(`${month}-01T00:00:00.000Z`);
        next.setUTCMonth(next.getUTCMonth() + 1);
        month = next.toISOString().slice(0, 7);
      }
      return points;
    }

    for (let date = range.startDate; date <= range.endDate; date = shiftDate(date, 1)) {
      const row = rows.get(date);
      points.push({ date, sales: row?.sales ?? 0, revenue: Number(row?.revenue ?? 0) });
    }
    return points;
  }

  private async getProductRanking(range: DateRange, sortBy: 'units' | 'revenue') {
    if (sortBy === 'units') {
      return this.prisma.$queryRaw<ProductRow[]>`
        SELECT p."id", p."name", p."imageUrl",
          SUM(oi."quantity") AS "unitsSold",
          COALESCE(SUM(oi."subtotal"), 0)::text AS "revenue"
        FROM "OrderItem" oi
        JOIN "Order" o ON o."id" = oi."orderId"
        JOIN "PaymentPreference" pp ON pp."orderId" = o."id"
        JOIN "Product" p ON p."id" = oi."productId"
        WHERE o."createdAt" >= ${range.start}
          AND o."createdAt" < ${range.end}
          AND o."paymentStatus" = 'APPROVED'::"PaymentStatus"
          AND pp."sandbox" = false
          AND o."status" NOT IN ('CANCELLED'::"OrderStatus", 'REFUNDED'::"OrderStatus")
        GROUP BY p."id", p."name", p."imageUrl"
        ORDER BY SUM(oi."quantity") DESC, SUM(oi."subtotal") DESC
        LIMIT 10
      `;
    }

    return this.prisma.$queryRaw<ProductRow[]>`
      SELECT p."id", p."name", p."imageUrl",
        SUM(oi."quantity") AS "unitsSold",
        COALESCE(SUM(oi."subtotal"), 0)::text AS "revenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      JOIN "PaymentPreference" pp ON pp."orderId" = o."id"
      JOIN "Product" p ON p."id" = oi."productId"
      WHERE o."createdAt" >= ${range.start}
        AND o."createdAt" < ${range.end}
        AND o."paymentStatus" = 'APPROVED'::"PaymentStatus"
        AND pp."sandbox" = false
        AND o."status" NOT IN ('CANCELLED'::"OrderStatus", 'REFUNDED'::"OrderStatus")
      GROUP BY p."id", p."name", p."imageUrl"
      ORDER BY SUM(oi."subtotal") DESC, SUM(oi."quantity") DESC
      LIMIT 10
    `;
  }

  private async *csvRows(where: Prisma.OrderWhereInput) {
    const headers = [
      'Pedido',
      'Fecha',
      'Cliente',
      'Productos',
      'Unidades',
      'Subtotal ARS',
      'Envío ARS',
      'Total ARS',
      'Estado',
      'Estado de pago',
    ];
    yield `\uFEFF${headers.map(csvCell).join(',')}\r\n`;
    let cursor: string | undefined;
    while (true) {
      const rows = await this.prisma.order.findMany({
        where,
        orderBy: [{ id: 'asc' }],
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: 500,
        select: {
          id: true,
          createdAt: true,
          subtotal: true,
          shippingCost: true,
          total: true,
          status: true,
          paymentStatus: true,
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
      });
      if (rows.length === 0) return;
      for (const order of rows) {
        const values = [
          order.id,
          order.createdAt.toISOString(),
          order.user.name || order.user.email,
          order.items.map((item) => `${item.quantity} x ${item.product.name}`).join('; '),
          order.items.reduce((sum, item) => sum + item.quantity, 0),
          order.subtotal.toString(),
          order.shippingCost.toString(),
          order.total.toString(),
          order.status,
          order.paymentStatus,
        ];
        yield `${values.map(csvCell).join(',')}\r\n`;
      }
      cursor = rows[rows.length - 1].id;
      if (rows.length < 500) return;
    }
  }
}
