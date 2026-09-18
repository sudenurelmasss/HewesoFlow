import {
  getStoredToken,
} from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

export interface ProjectMessage {
  id: string;

  projectId: string;

  senderUserId: string;
  senderName: string;

  recipientUserId?: string | null;
  recipientName?: string | null;

  isPrivate?: boolean;

  content: string;

  createdAt: string;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

function headers(
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

async function fail(
  response: Response
): Promise<never> {
  let message =
    `İşlem başarısız. (${response.status})`;

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

function unwrapList(
  result:
    | ProjectMessage[]
    | ApiResponse<ProjectMessage[]>
): ProjectMessage[] {
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

function unwrapOne(
  result:
    | ProjectMessage
    | ApiResponse<ProjectMessage>
): ProjectMessage {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    result.data
  ) {
    return result.data;
  }

  return result as ProjectMessage;
}

export async function getProjectMessages(
  projectId: string
): Promise<ProjectMessage[]> {
  const response =
    await fetch(
      `${API_URL}/api/projects/${projectId}/messages`,
      {
        method: "GET",

        headers:
          headers(),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  const result:
    | ProjectMessage[]
    | ApiResponse<ProjectMessage[]> =
    await response.json();

  return unwrapList(
    result
  );
}

export async function sendProjectMessage(
  projectId: string,
  content: string,
  recipientUserId?: string | null
): Promise<ProjectMessage> {
  const value =
    content.trim();

  if (!value) {
    throw new Error(
      "Mesaj boş bırakılamaz."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/projects/${projectId}/messages`,
      {
        method: "POST",

        headers:
          headers(true),

        body:
          JSON.stringify({
            content:
              value,

            recipientUserId:
              recipientUserId ||
              null,
          }),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  const result:
    | ProjectMessage
    | ApiResponse<ProjectMessage> =
    await response.json();

  return unwrapOne(
    result
  );
}