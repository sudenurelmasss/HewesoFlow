import {
  getStoredToken,
} from "./authService";

export interface Department {
  id: string;

  name: string;

  /*
   * Backend eski yapıyla uyumlu olduğu için
   * bunlar response içerisinde bulunabilir.
   * Frontend artık kullanmayacak.
   */
  description?: string | null;

  managerId?: string | null;
  managerName?: string | null;

  isActive?: boolean;

  /*
   * Buradaki userCount yalnızca
   * aktif kullanıcı sayısıdır.
   */
  userCount?: number;

  projectCount?: number;
}

export interface CreateDepartmentRequest {
  name: string;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

export class DepartmentForbiddenError
  extends Error {
  constructor() {
    super(
      "Bu işlem için yetkiniz bulunmuyor."
    );

    this.name =
      "DepartmentForbiddenError";
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

function getHeaders(
  json = false
): HeadersInit {
  const token =
    getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı."
    );
  }

  return {
    Accept:
      "application/json",

    Authorization:
      `Bearer ${token}`,

    ...(json
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
  };
}

async function readError(
  response: Response
) {
  try {
    const result =
      await response.json();

    return (
      result?.message ||
      result?.title ||
      `İşlem başarısız. Hata kodu: ${response.status}`
    );
  } catch {
    return `İşlem başarısız. Hata kodu: ${response.status}`;
  }
}

function unwrapList(
  result:
    | Department[]
    | ApiResponse<Department[]>
): Department[] {
  if (Array.isArray(
      result)) {
    return result;
  }

  if (
    result &&
    Array.isArray(
      result.data)
  ) {
    return result.data;
  }

  return [];
}

export async function getDepartments():
  Promise<Department[]> {
  const response =
    await fetch(
      `${API_URL}/api/Departments`,
      {
        method:
          "GET",

        headers:
          getHeaders(),

        cache:
          "no-store",
      }
    );

  if (
    response.status ===
    401
  ) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (
    response.status ===
    403
  ) {
    throw new DepartmentForbiddenError();
  }

  if (!response.ok) {
    throw new Error(
      await readError(
        response)
    );
  }

  const result =
    await response.json();

  return unwrapList(
    result);
}

export async function createDepartment(
  request: CreateDepartmentRequest
): Promise<Department> {
  const name =
    request.name.trim();

  if (!name) {
    throw new Error(
      "Departman adı zorunludur."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/Departments`,
      {
        method:
          "POST",

        headers:
          getHeaders(true),

        body:
          JSON.stringify({
            name,
          }),
      }
    );

  if (
    response.status ===
    401
  ) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (
    response.status ===
    403
  ) {
    throw new DepartmentForbiddenError();
  }

  if (!response.ok) {
    throw new Error(
      await readError(
        response)
    );
  }

  return response.json();
}