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

export interface AvailableProjectUser {
  id: string;

  firstName: string;
  lastName: string;
  email: string;

  department?: string | null;

  isActive: boolean;

  roles: string[];
}

export interface AddProjectMemberRequest {
  projectId: string;
  userId: string;

  /*
   * 0 = Member
   * 1 = Contributor
   * 2 = Viewer
   */
  role: number;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
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
      "Oturum bulunamadı. Lütfen tekrar giriş yapın."
    );
  }

  return {
    Accept: "application/json",

    ...(json
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    Authorization:
      `Bearer ${token}`,
  };
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const result =
      await response.json();

    return (
      result?.message ||
      result?.title ||
      `İstek başarısız oldu. Hata kodu: ${response.status}`
    );
  } catch {
    return `İstek başarısız oldu. Hata kodu: ${response.status}`;
  }
}

function unwrapMemberList(
  result:
    | ProjectMember[]
    | ApiResponse<ProjectMember[]>
): ProjectMember[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    Array.isArray(
      result.data
    )
  ) {
    return result.data;
  }

  return [];
}

function unwrapUserList(
  result:
    | AvailableProjectUser[]
    | ApiResponse<AvailableProjectUser[]>
): AvailableProjectUser[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    Array.isArray(
      result.data
    )
  ) {
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

  const response =
    await fetch(
      `${API_URL}/api/ProjectMembers/project/${encodeURIComponent(
        projectId
      )}`,
      {
        method: "GET",
        headers:
          getHeaders(),
        cache: "no-store",
      }
    );

  if (
    response.status === 401
  ) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (
    response.status === 403
  ) {
    throw new Error(
      "Proje üyelerini görüntüleme yetkiniz bulunmuyor."
    );
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  const result:
    | ProjectMember[]
    | ApiResponse<ProjectMember[]> =
    await response.json();

  return unwrapMemberList(
    result
  );
}

export async function getAvailableProjectUsers(): Promise<
  AvailableProjectUser[]
> {
  const response =
    await fetch(
      `${API_URL}/api/Users`,
      {
        method: "GET",
        headers:
          getHeaders(),
        cache: "no-store",
      }
    );

  if (
    response.status === 401
  ) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (
    response.status === 403
  ) {
    throw new Error(
      "Kullanıcı listesini görüntüleme yetkiniz bulunmuyor."
    );
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  const result:
    | AvailableProjectUser[]
    | ApiResponse<AvailableProjectUser[]> =
    await response.json();

  return unwrapUserList(
    result
  ).filter(
    (user) =>
      user.isActive === true
  );
}

export async function addProjectMember(
  request: AddProjectMemberRequest
): Promise<ProjectMember> {
  if (
    !request.projectId
  ) {
    throw new Error(
      "Proje bilgisi bulunamadı."
    );
  }

  if (!request.userId) {
    throw new Error(
      "Projeye eklenecek kullanıcıyı seçin."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/ProjectMembers`,
      {
        method: "POST",

        headers:
          getHeaders(true),

        body:
          JSON.stringify({
            projectId:
              request.projectId,

            userId:
              request.userId,

            role:
              request.role,
          }),
      }
    );

  if (
    response.status === 401
  ) {
    throw new Error(
      "Oturum süresi dolmuş olabilir."
    );
  }

  if (
    response.status === 403
  ) {
    throw new Error(
      "Bu projeye kullanıcı ekleme yetkiniz bulunmuyor."
    );
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  return await response.json();
}

export function getProjectMemberRole(
  role: string | number
): string {
  if (
    typeof role ===
    "string"
  ) {
    return role;
  }

  switch (role) {
    case 0:
      return "Üye";

    case 1:
      return "Katılımcı";

    case 2:
      return "Görüntüleyici";

    default:
      return "Üye";
  }
}