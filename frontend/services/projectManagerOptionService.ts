import {
  getStoredToken,
} from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

export interface ProjectManagerOption {
  id: string;

  firstName: string;
  lastName: string;

  fullName: string;

  email: string;

  departmentId: string;
  departmentName: string;
}

function getHeaders(): HeadersInit {
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
  };
}

export async function getProjectManagerOptions(
  departmentId: string
): Promise<ProjectManagerOption[]> {
  if (!departmentId) {
    return [];
  }

  const response =
    await fetch(
      `${API_URL}/api/project-manager-options?departmentId=${encodeURIComponent(
        departmentId
      )}`,
      {
        method: "GET",

        headers:
          getHeaders(),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    let message =
      "ProjectManager listesi alınamadı.";

    try {
      const result =
        await response.json();

      message =
        result?.message ||
        result?.title ||
        message;
    } catch {}

    throw new Error(
      message
    );
  }

  const result =
    await response.json();

  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    Array.isArray(result.data)
  ) {
    return result.data;
  }

  return [];
}