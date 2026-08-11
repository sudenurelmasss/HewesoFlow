import { getStoredToken } from "./authService";

export interface TeamMember {
  id: string;

  userId?: string | null;

  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;

  email?: string | null;

  role?: string | null;
  department?: string | null;

  isActive?: boolean;

  projectId?: string | null;
  projectName?: string | null;

  joinedAt?: string | null;
  createdAt?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

export class ForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

function getHeaders() {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function unwrapList(
  result: TeamMember[] | ApiResponse<TeamMember[]>
): TeamMember[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const endpoints = [
    `${API_URL}/api/Users`,
    `${API_URL}/api/User`,
    `${API_URL}/api/Team`,
    `${API_URL}/api/ProjectMembers`,
    `${API_URL}/api/ProjectMember`,
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
      throw new ForbiddenError();
    }

    if (!response.ok) {
      throw new Error(
        `Ekip bilgileri alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | TeamMember[]
      | ApiResponse<TeamMember[]> =
      await response.json();

    return unwrapList(result);
  }

  return [];
}