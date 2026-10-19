import { API_URL } from './config';

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export type LoginResult = AuthResponse | { mfaRequired: true; mfaToken: string };

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  mfaEnabled: boolean;
  createdAt: string;
};

const apiUrl = API_URL;

export const AUTH_CHANGE_EVENT = 'lucia-auth-changed';

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Email o contraseña inválidos');
  }

  return response.json() as Promise<LoginResult>;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<void> {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No se pudo crear la cuenta');
  }
}

export async function me(token: string): Promise<UserProfile> {
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Sesión inválida');
  }

  return response.json() as Promise<UserProfile>;
}

export function googleAuthUrl(): string {
  return `${apiUrl}/auth/google`;
}

export function saveSession(session: AuthResponse) {
  window.localStorage.setItem('lucia_access_token', session.accessToken);
  window.localStorage.setItem('lucia_user', JSON.stringify(session.user));
  notifyAuthChange();
}

export function saveAccessToken(accessToken: string) {
  window.localStorage.setItem('lucia_access_token', accessToken);
  notifyAuthChange();
}

export function getAccessToken() {
  return window.localStorage.getItem('lucia_access_token');
}

export function clearSession() {
  window.localStorage.removeItem('lucia_access_token');
  window.localStorage.removeItem('lucia_user');
  notifyAuthChange();
}