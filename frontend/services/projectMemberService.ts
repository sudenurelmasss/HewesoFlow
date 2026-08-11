import { getStoredToken } from "./authService";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;

  firstName: string;
  lastName: string;
  fullName: string;
  email: string;

  role: string | number;

  joinedAt: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

function getHeaders() {
  const token = getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı. Lütfen tekrar giriş yapın."
    );
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const result = await response.json();

    return (
      result?.message ||
      result?.title ||
      `İstek başarısız oldu. Hata kodu: ${response.status}`
    );
  } catch {
    return `İstek başarısız oldu. Hata kodu: ${response.status}`;
  }
}

function unwrapList(
  result:
    | ProjectMember[]
    | ApiResponse<ProjectMember[]>
): ProjectMember[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  if (!projectId) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/api/ProjectMembers/project/${encodeURIComponent(
      projectId
    )}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "Proje üyelerini görüntüleme yetkiniz bulunmuyor."
    );
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const result:
    | ProjectMember[]
    | ApiResponse<ProjectMember[]> =
    await response.json();

  return unwrapList(result);
}

export function getProjectMemberRole(
  role: string | number
): string {
  if (typeof role === "string") {
    return role;
  }

  switch (role) {
    case 0:
      return "Member";

    case 1:
      return "Contributor";

    case 2:
      return "Viewer";

    default:
      return "Member";
  }
}