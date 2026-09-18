import {
  getStoredToken,
} from "./authService";

export interface Project {
  id: string;

  name: string;

  description?: string | null;

  departmentId: string;
  departmentName?: string | null;

  projectManagerId: string;
  projectManagerName?: string | null;

  status?: string | number;

  startDate?: string | null;
  endDate?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  requiresMemberApproval?: boolean;

  completionRequestedAt?: string | null;
  completionApprovedAt?: string | null;
  completionApprovedByUserId?: string | null;

  ownerId?: string | null;
}

export interface CreateProjectRequest {
  name: string;

  description: string;

  departmentId: string;

  projectManagerId?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  requiresMemberApproval?: boolean;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

const PROJECT_ENDPOINT =
  `${API_URL}/api/Project`;

function getHeaders(): HeadersInit {
  const token =
    getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı."
    );
  }

  return {
    "Content-Type":
      "application/json",

    Accept:
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}

async function handleError(
  response: Response
): Promise<never> {
  let message =
    `İstek başarısız oldu. Hata kodu: ${response.status}`;

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

function unwrapProject(
  result:
    | Project
    | ApiResponse<Project>
): Project {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    result.data
  ) {
    return result.data;
  }

  return result as Project;
}

function unwrapList(
  result:
    | Project[]
    | ApiResponse<Project[]>
): Project[] {
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

export async function getProjects():
  Promise<Project[]> {
  const response =
    await fetch(
      PROJECT_ENDPOINT,
      {
        method:
          "GET",

        headers:
          getHeaders(),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return handleError(
      response
    );
  }

  const result =
    await response.json();

  return unwrapList(
    result
  );
}

export async function getProjectById(
  id: string
): Promise<Project | null> {
  const response =
    await fetch(
      `${PROJECT_ENDPOINT}/${id}`,
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
    404
  ) {
    return null;
  }

  if (!response.ok) {
    return handleError(
      response
    );
  }

  return unwrapProject(
    await response.json()
  );
}

export async function createProject(
  request: CreateProjectRequest
): Promise<Project> {
  const name =
    request.name.trim();

  const description =
    request.description.trim();

  if (!name) {
    throw new Error(
      "Proje adı zorunludur."
    );
  }

  if (!description) {
    throw new Error(
      "Proje açıklaması zorunludur."
    );
  }

  if (!request.departmentId) {
    throw new Error(
      "Departman seçilmelidir."
    );
  }

  if (
    request.startDate &&
    request.endDate &&
    request.endDate <
      request.startDate
  ) {
    throw new Error(
      "Bitiş tarihi başlangıç tarihinden önce olamaz."
    );
  }

  const response =
    await fetch(
      PROJECT_ENDPOINT,
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify({
            name,

            description,

            departmentId:
              request.departmentId,

            projectManagerId:
              request.projectManagerId ||
              null,

            startDate:
              request.startDate ||
              null,

            endDate:
              request.endDate ||
              null,

            requiresMemberApproval:
              request.requiresMemberApproval ??
              false,
          }),
      }
    );

  if (!response.ok) {
    return handleError(
      response
    );
  }

  return unwrapProject(
    await response.json()
  );
}

export async function requestProjectCompletion(
  id: string
): Promise<Project> {
  const response =
    await fetch(
      `${PROJECT_ENDPOINT}/${id}/request-completion`,
      {
        method:
          "POST",

        headers:
          getHeaders(),
      }
    );

  if (!response.ok) {
    return handleError(
      response
    );
  }

  return unwrapProject(
    await response.json()
  );
}

export async function approveProjectCompletion(
  id: string
): Promise<Project> {
  const response =
    await fetch(
      `${PROJECT_ENDPOINT}/${id}/approve-completion`,
      {
        method:
          "POST",

        headers:
          getHeaders(),
      }
    );

  if (!response.ok) {
    return handleError(
      response
    );
  }

  return unwrapProject(
    await response.json()
  );
}

export async function deleteProject(
  id: string
): Promise<void> {
  const response =
    await fetch(
      `${PROJECT_ENDPOINT}/${id}`,
      {
        method:
          "DELETE",

        headers:
          getHeaders(),
      }
    );

  if (!response.ok) {
    return handleError(
      response
    );
  }
}