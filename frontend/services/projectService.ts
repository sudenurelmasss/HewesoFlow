import { getStoredToken } from "./authService";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: string | number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

const PROJECT_ENDPOINT = `${API_URL}/api/Project`;

function getHeaders() {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleError(response: Response) {
  let message = `İstek başarısız oldu. Hata kodu: ${response.status}`;

  try {
    const result = await response.json();

    if (result?.message) {
      message = result.message;
    }
  } catch {}

  throw new Error(message);
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(PROJECT_ENDPOINT, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    await handleError(response);
  }

  const result: Project[] | ApiResponse<Project[]> =
    await response.json();

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getProjectById(
  id: string
): Promise<Project | null> {
  const response = await fetch(
    `${PROJECT_ENDPOINT}/${id}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    await handleError(response);
  }

  const result: Project | ApiResponse<Project> =
    await response.json();

  if ("data" in result && result.data) {
    return result.data;
  }

  return result as Project;
}

export async function createProject(
  request: CreateProjectRequest
): Promise<Project | null> {
  const response = await fetch(PROJECT_ENDPOINT, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: request.name,
      description: request.description || null,
      startDate: request.startDate || null,
      endDate: request.endDate || null,
    }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  if (response.status === 204) {
    return null;
  }

  const result: Project | ApiResponse<Project> =
    await response.json();

  if ("data" in result && result.data) {
    return result.data;
  }

  return result as Project;
}