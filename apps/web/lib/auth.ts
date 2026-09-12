export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Email o contraseña inválidos');
  }

  return response.json() as Promise<AuthResponse>;
}

export function saveSession(session: AuthResponse) {
  window.localStorage.setItem('lucia_access_token', session.accessToken);
  window.localStorage.setItem('lucia_user', JSON.stringify(session.user));
}

export function getAccessToken() {
  return window.localStorage.getItem('lucia_access_token');
}
