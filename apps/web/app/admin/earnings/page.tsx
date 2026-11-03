'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Logo } from '../../../components/logo';
import { formatPrice } from '../../../lib/utils';
import {
  downloadAdminEarningsCsv,
  getAdminEarnings,
} from '../../../lib/admin';
import type { AdminEarningsReport } from '../../../lib/admin';

const periods = [
  ['today', 'Hoy'],
  ['yesterday', 'Ayer'],
  ['last7', 'Últimos 7 días'],
  ['last30', 'Últimos 30 días'],
  ['thisWeek', 'Esta semana'],
  ['thisMonth', 'Este mes'],
  ['lastMonth', 'Mes anterior'],
  ['thisYear', 'Este año'],
  ['custom', 'Personalizado'],
] as const;

const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

function todayDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: 'year' | 'month' | 'day') => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));
}

function formatComparison(value: number | null) {
  if (value === null) return 'Sin período anterior comparable';
  if (value === 0) return 'Sin cambios vs. período anterior';
  const direction = value > 0 ? '↑' : '↓';
  return `${direction} ${Math.abs(value).toLocaleString('es-AR')}% vs. período anterior`;
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="min-w-0 border border-line bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      <p className="mt-4 break-words font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">{value}</p>
      {detail && <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>}
    </article>
  );
}

export default function AdminEarningsPage() {
  const [period, setPeriod] = useState('last30');
  const [from, setFrom] = useState(todayDate);
  const [to, setTo] = useState(todayDate);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<AdminEarningsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminEarnings({
        period,
        ...(period === 'custom' ? { from, to } : {}),
        page,
        status,
        search: submittedSearch,
      });
      setReport(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [from, page, period, status, submittedSearch, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...(report?.trend.map((point) => point.revenue) ?? [])),
    [report?.trend],
  );

  async function exportCsv() {
    setExporting(true);
    setError('');
    try {
      const blob = await downloadAdminEarningsCsv({
        period,
        ...(period === 'custom' ? { from, to } : {}),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganancias-${report?.range.from ?? from}-${report?.range.to ?? to}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo exportar el informe.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="admin-earnings mx-auto min-h-[100dvh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="earnings-controls flex items-center justify-between gap-4">
        <Link className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></Link>
        <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</Link>
      </div>
      <Link className="mt-8 inline-flex min-h-11 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-muted" href="/admin">
        <span aria-hidden="true">←</span> Volver al panel
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Administración</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,8vw,3.75rem)] font-black uppercase tracking-[-0.02em]">Ganancias</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Ventas cobradas y actividad calculadas con los pedidos registrados. Facturación y ganancia neta no son lo mismo.
          </p>
        </div>
        <div className="earnings-controls flex flex-wrap gap-2">
          <button className="btn-ghost" disabled={loading} onClick={() => void load()} type="button">Actualizar</button>
          <button className="btn-ghost" disabled={exporting || loading} onClick={() => void exportCsv()} type="button">
            {exporting ? 'Preparando CSV…' : 'Exportar CSV'}
          </button>
          <button className="btn-ghost" onClick={() => window.print()} type="button">Imprimir / PDF</button>
        </div>
      </div>

      <section aria-label="Filtros del informe" className="earnings-controls mt-8 grid gap-4 border border-line bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(12rem,1fr)_repeat(2,minmax(10rem,0.7fr))_auto]">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Período
          <select className="input-line mt-2 text-sm normal-case tracking-normal text-ink" onChange={(event) => { setPeriod(event.target.value); setPage(1); }} value={period}>
            {periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {period === 'custom' && (
          <>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Desde
              <input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" onChange={(event) => { setFrom(event.target.value); setPage(1); }} type="date" value={from} />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Hasta
              <input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" onChange={(event) => { setTo(event.target.value); setPage(1); }} type="date" value={to} />
            </label>
          </>
        )}
        {report && (
          <p className="self-end pb-3 text-xs text-muted">
            {report.range.from} a {report.range.to} · zona horaria Argentina
          </p>
        )}
      </section>

      {error && <p className="mt-5 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      {loading && <p className="mt-5 text-sm text-muted" role="status">Cargando estadísticas…</p>}
      {!loading && report && (
        <>
          <section aria-label="Indicadores" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Ventas cobradas" value={report.summary.completedSales.toLocaleString('es-AR')} detail={formatComparison(report.summary.comparison.completedSales)} />
            <MetricCard title="Total cobrado · ARS" value={formatPrice(report.summary.collectedTotal)} detail={formatComparison(report.summary.comparison.collectedTotal)} />
            <MetricCard title="Unidades vendidas" value={report.summary.unitsSold.toLocaleString('es-AR')} detail={`${report.summary.previous.unitsSold.toLocaleString('es-AR')} en el período anterior`} />
            <MetricCard title="Ticket promedio · ARS" value={formatPrice(report.summary.averageTicket)} detail="Sobre pedidos con pago aprobado" />
            <MetricCard title="Ventas pendientes" value={report.summary.pendingOrders.toLocaleString('es-AR')} detail="Pedidos pendientes de completar o cobrar" />
            <MetricCard title="Pedidos reembolsados" value={report.summary.refundedOrders.toLocaleString('es-AR')} detail="Estado de pago marcado como reembolsado" />
            <MetricCard title="Importe reembolsado" value="No disponible" detail="No se guardan importes ni reembolsos parciales." />
            <MetricCard title="Ganancia neta" value="No disponible" detail="Faltan costos de productos y gastos operativos." />
          </section>

          <section className="mt-6 border border-line bg-white p-5 sm:p-7" aria-labelledby="revenue-trend-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]" id="revenue-trend-title">Ventas cobradas en el tiempo</h2>
                <p className="mt-1 text-sm text-muted">Importes totales de pedidos con pago aprobado, incluido el envío.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">ARS</span>
            </div>
            {report.trend.length > 0 ? (
              <div className="mt-6 flex h-56 items-end gap-1 overflow-x-auto border-b border-line pb-1 sm:gap-2">
                {report.trend.map((point) => (
                  <div className="group flex h-full min-w-5 flex-1 flex-col items-center justify-end sm:min-w-8" key={point.date} title={`${point.date}: ${formatPrice(point.revenue)} · ${point.sales} ventas`}>
                    <span className="mb-1 hidden text-[10px] text-muted group-hover:block">{point.sales}</span>
                    <div className="w-full max-w-12 bg-[#b69458] transition-[height] duration-300" style={{ height: `${point.revenue ? Math.max(3, (point.revenue / maxRevenue) * 90) : 0}%` }} />
                    <span className="mt-2 max-w-full truncate text-[9px] text-muted">{point.date.slice(-5)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-6 text-sm text-muted">No hay ventas cobradas para graficar en este período.</p>}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <Ranking title="Productos más vendidos" products={report.products.byUnits} metric="units" />
            <Ranking title="Productos con más ingresos" products={report.products.byRevenue} metric="revenue" />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <article className="border border-line bg-white p-5 sm:p-7">
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">Métodos de pago</h2>
              {report.paymentMethods.length ? (
                report.paymentMethods.map((method) => (
                  <div className="mt-5 flex justify-between gap-3 border-b border-line pb-3 text-sm" key={method.method}>
                    <span>{method.method}</span><span className="font-semibold">{formatPrice(method.amount)} · {method.sales} ventas</span>
                  </div>
                ))
              ) : <p className="mt-4 text-sm text-muted">No hay pagos aprobados en este período.</p>}
              <p className="mt-4 text-xs leading-5 text-muted">La integración de cobro disponible en el sistema es Mercado Pago. No se registran otros medios.</p>
            </article>
            <article className="border border-amber-700/30 bg-amber-50 p-5 sm:p-7">
              <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">Datos financieros faltantes</h2>
              <p className="mt-3 text-sm leading-6">{report.summary.limitations.message}</p>
              <p className="mt-3 text-sm leading-6">Por eso no mostramos ganancias netas, costos, devoluciones de unidades ni dinero reembolsado como si fueran cero.</p>
            </article>
          </section>

          <section className="mt-8" aria-labelledby="sales-history-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]" id="sales-history-title">Ventas y pedidos</h2>
                <p className="mt-1 text-sm text-muted">{report.orders.total.toLocaleString('es-AR')} pedidos en el período</p>
              </div>
              <form className="earnings-controls flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search.trim()); setPage(1); }}>
                <label className="sr-only" htmlFor="earnings-search">Buscar pedido o cliente</label>
                <input className="input-line min-w-40 text-sm normal-case tracking-normal" id="earnings-search" onChange={(event) => setSearch(event.target.value)} placeholder="Pedido o cliente" value={search} />
                <label className="sr-only" htmlFor="earnings-status">Filtrar por estado</label>
                <select className="input-line text-sm normal-case tracking-normal" id="earnings-status" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
                  <option value="">Todos los estados</option>
                  {orderStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <button className="btn-ghost" type="submit">Buscar</button>
              </form>
            </div>
            <div className="mt-4 overflow-x-auto border border-line bg-white">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-sand text-[10px] uppercase tracking-[0.14em] text-muted">
                  <tr>{['Pedido / fecha', 'Cliente', 'Artículos', 'Pago', 'Estado', 'Total cobrado'].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody>
                  {report.orders.data.map((order) => (
                    <tr className="border-t border-line" key={order.id}>
                      <td className="p-3"><span className="block font-semibold">{order.id.slice(0, 8)}</span><span className="text-xs text-muted">{formatDate(order.createdAt)}</span></td>
                      <td className="p-3">{order.customer}</td>
                      <td className="max-w-64 truncate p-3" title={order.items}>{order.itemCount} · {order.items}</td>
                      <td className="p-3">{order.paymentMethod}<span className="block text-xs text-muted">{order.paymentStatus}</span></td>
                      <td className="p-3">{order.status}</td>
                      <td className="p-3 font-semibold">{formatPrice(Number(order.total))}</td>
                    </tr>
                  ))}
                  {report.orders.data.length === 0 && <tr><td className="p-6 text-center text-muted" colSpan={6}>No se encontraron pedidos para estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
            {report.orders.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-3 text-xs">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">Anterior</button>
                <span>Página {report.orders.page} de {report.orders.totalPages}</span>
                <button className="btn-ghost" disabled={page >= report.orders.totalPages} onClick={() => setPage((current) => current + 1)} type="button">Siguiente</button>
              </div>
            )}
          </section>

          <section className="mt-6 border border-line bg-white p-5 sm:p-7">
            <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">Devoluciones</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{report.returns.message} Se informan por separado los pedidos cuyo pago figura como reembolsado; el sistema no tiene detalle para calcular unidades o montos parciales.</p>
          </section>
        </>
      )}
    </main>
  );
}

function Ranking({
  title,
  products,
  metric,
}: {
  title: string;
  products: AdminEarningsReport['products']['byUnits'];
  metric: 'units' | 'revenue';
}) {
  return (
    <article className="min-w-0 border border-line bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">{title}</h2>
      {products.length ? (
        <ol className="mt-4 divide-y divide-line">
          {products.map((product) => (
            <li className="flex items-center justify-between gap-4 py-3" key={product.id}>
              <span className="min-w-0 truncate text-sm font-medium">{product.name}</span>
              <span className="shrink-0 text-right text-xs text-muted">
                {metric === 'units' ? `${product.unitsSold} unidades` : formatPrice(product.revenue)}
              </span>
            </li>
          ))}
        </ol>
      ) : <p className="mt-4 text-sm text-muted">No hay datos de ventas para este período.</p>}
      <p className="mt-3 text-xs text-muted">No se calcula margen: el costo de compra no está registrado.</p>
    </article>
  );
}
