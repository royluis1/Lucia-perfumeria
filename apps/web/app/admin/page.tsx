import Link from 'next/link';

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</Link>
        <Link className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Ver tienda</Link>
      </div>
      <p className="mt-20 text-xs uppercase tracking-[0.3em] text-black/50">Administración</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-none">Panel admin</h1>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          ['Productos', 'Gestioná catálogo, precios y stock.'],
          ['Pedidos', 'Revisá órdenes y estados de pago.'],
          ['Reseñas', 'Moderá opiniones pendientes.'],
        ].map(([title, description]) => (
          <section className="border border-black/10 bg-white p-6" key={title}>
            <h2 className="font-display text-3xl font-bold uppercase">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/60">{description}</p>
            <button className="mt-8 border border-black px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]" type="button">Abrir módulo</button>
          </section>
        ))}
      </div>
    </main>
  );
}
