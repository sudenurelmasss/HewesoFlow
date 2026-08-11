import { getStoredToken } from "./authService";

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

export class DepartmentForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "DepartmentForbiddenError";
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

function unwrapList(
  result: Department[] | ApiResponse<Department[]>
): Department[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getDepartments(): Promise<Department[]> {
  const endpoints = [
    `${API_URL}/api/Departments`,
    `${API_URL}/api/Department`,
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
      throw new DepartmentForbiddenError();
    }

    if (!response.ok) {
      throw new Error(
        `Departmanlar alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | Department[]
      | ApiResponse<Department[]> =
      await response.json();

    return unwrapList(result);
  }

  return [];
}