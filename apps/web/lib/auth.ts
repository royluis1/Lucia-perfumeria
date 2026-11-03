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
export const AUTH_REDIRECT_KEY = 'lucia_auth_redirect';
const ACCESS_TOKEN_KEY = 'lucia_access_token';
const USER_KEY = 'lucia_user';
let refreshInProgress: Promise<string | null> | null = null;

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;
  const destination = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?redirect=${encodeURIComponent(destination)}`);
}

export function getSafeRedirectDestination(destination: string | null | undefined) {
  if (!destination || !destination.startsWith('/') || destination.startsWith('//') || destination.includes('\\')) {
    return '/';
  }
  return destination;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      let response: Response;
      try {
        response = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
      } catch {
        throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.');
      }
      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error('No pudimos renovar tu sesión. Intentá nuevamente.');
      }

      const body = (await response.json().catch(() => null)) as { accessToken?: unknown } | null;
      if (!body || typeof body.accessToken !== 'string' || !body.accessToken) {
        throw new Error('No pudimos renovar tu sesión. Intentá nuevamente.');
      }
      saveAccessToken(body.accessToken);
      return body.accessToken;
    })().finally(() => {
      refreshInProgress = null;
    });
  }
  return refreshInProgress;
}

export async function recoverSessionAfterUnauthorized(
  redirectOnExpired = true,
  previousToken = getAccessToken(),
) {
  const currentToken = getAccessToken();
  if (currentToken && currentToken !== previousToken) return currentToken;

  const token = await refreshAccessToken();
  if (!token) {
    clearSession();
    if (redirectOnExpired) redirectToLogin();
  }
  return token;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { redirectOnExpired?: boolean } = {},
): Promise<Response> {
  const redirectOnExpired = options.redirectOnExpired ?? true;
  const send = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    try {
      return await fetch(`${apiUrl}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      });
    } catch {
      throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.');
    }
  };

  const originalToken = getAccessToken();
  const response = await send(originalToken);
  if (response.status !== 401) return response;

  const newToken = await recoverSessionAfterUnauthorized(redirectOnExpired, originalToken);
  if (!newToken) {
    return response;
  }
  const retriedResponse = await send(newToken);
  if (retriedResponse.status === 401) {
    expireSession(redirectOnExpired);
  }
  return retriedResponse;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.');
  }

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
    credentials: 'include',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No se pudo crear la cuenta');
  }
}

export async function me(
  token = getAccessToken(),
  redirectOnExpired = true,
): Promise<UserProfile> {
  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await apiFetch('/auth/me', { headers }, { redirectOnExpired });

  if (!response.ok) {
    throw new Error('No se pudo verificar tu sesión');
  }

  return response.json() as Promise<UserProfile>;
}

export function googleAuthUrl(): string {
  return `${apiUrl}/auth/google`;
}

export function saveSession(session: AuthResponse) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  notifyAuthChange();
}

export function saveAccessToken(accessToken: string) {
  const hadAccessToken = Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (!hadAccessToken) notifyAuthChange();
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  notifyAuthChange();
}

export function expireSession(redirect = true) {
  clearSession();
  if (redirect) redirectToLogin();
}

export async function logout() {
  try {
    const response = await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('No se pudo invalidar la sesión en el servidor.');
  } finally {
    clearSession();
  }
}
