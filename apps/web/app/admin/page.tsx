import Link from 'next/link';
import { Logo } from '../../components/logo';

const modules: Array<{ title: string; description: string; href: string }> = [
  { title: 'Portada', description: 'Elegí el hero y los productos favoritos del inicio.', href: '/admin/home' },
  { title: 'Productos', description: 'Catálogo, precios, stock, categorías e imágenes.', href: '/admin/products' },
  { title: 'Pedidos', description: 'Revisá órdenes y actualizá estados.', href: '/admin/orders' },
  { title: 'Usuarios', description: 'Gestioná roles de la tienda.', href: '/admin/users' },
  { title: 'Reseñas', description: 'Moderá opiniones pendientes.', href: '/admin/reviews' },
  { title: 'Auditoría', description: 'Historial de cambios del panel.', href: '/admin/audit' },
];

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/admin">
          <Logo className="text-xl" />
        </Link>
        <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">← Volver a la tienda</Link>
      </div>
      <p className="rv d1 mt-20 text-xs font-semibold uppercase tracking-[0.3em] text-muted">Administración</p>
      <h1 className="rv d1 mt-3 font-display text-6xl font-black uppercase leading-none tracking-[-0.02em]">Panel admin</h1>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ title, description, href }, index) => (
          <section
            className={`rv d${Math.min(index + 1, 5)} border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-black hover:shadow-[0_24px_40px_-32px_rgba(17,17,17,0.5)]`}
            key={title}
          >
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.02em]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            <Link className="btn-ghost mt-8" href={href}>Abrir módulo</Link>
          </section>
        ))}
      </div>
    </main>
  );
}
