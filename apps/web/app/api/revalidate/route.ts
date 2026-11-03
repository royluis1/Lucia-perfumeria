import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { API_URL } from '../../../lib/config';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const profileResponse = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!profileResponse.ok) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const profile = (await profileResponse.json()) as { role?: string };
  if (profile.role !== 'ADMIN' && profile.role !== 'SUPERADMIN') {
    return NextResponse.json({ message: 'Acceso prohibido' }, { status: 403 });
  }

  revalidateTag('home');
  revalidatePath('/');
  revalidatePath('/shop');

  return NextResponse.json({ revalidated: true });
}
