import { api, type ApiResponse } from '@/services/api';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number?: string;
  admission_number?: string;
  password: string;
  membership_type: 'full' | 'special' | 'associate';
  declaration_accepted: true;
}

interface LoginResult {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiResponse<LoginResult>>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<ApiResponse<{ user: Record<string, unknown> }>>(
    '/auth/register',
    payload
  );
  return data.data;
}

export async function fetchCurrentSession() {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/auth/me');
  return data.data;
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}
