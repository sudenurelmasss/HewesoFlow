import { getStoredToken } from "./authService";

export interface AdminUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;

  email: string;

  role?: string | null;
  department?: string | null;

  isActive?: boolean;
  createdAt?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

export class AdminForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "AdminForbiddenError";
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

function getHeaders(contentType = false) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  return {
    ...(contentType
      ? { "Content-Type": "application/json" }
      : {}),
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const endpoints = [
    `${API_URL}/api/Admin/users`,
    `${API_URL}/api/Users`,
    `${API_URL}/api/User`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });

    if (response.status === 404) {
      continue;
    }

    if (response.status === 401) {
      throw new Error("Oturum süresi dolmuş olabilir.");
    }

    if (response.status === 403) {
      throw new AdminForbiddenError();
    }

    if (!response.ok) {
      throw new Error(
        `Kullanıcılar alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | AdminUser[]
      | ApiResponse<AdminUser[]> =
      await response.json();

    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  }

  return [];
}