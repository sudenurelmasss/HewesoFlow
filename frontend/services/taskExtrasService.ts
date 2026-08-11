import { getStoredToken } from "./authService";

export interface CommentItem {
  id: string;
  content?: string | null;
  text?: string | null;

  userId?: string | null;
  userName?: string | null;
  createdByName?: string | null;

  createdAt?: string | null;
}

export interface TaskHistoryItem {
  id: string;

  action?: string | null;
  description?: string | null;

  oldValue?: string | null;
  newValue?: string | null;

  userName?: string | null;
  createdAt?: string | null;
}

export interface TimeLogItem {
  id: string;

  minutes?: number;
  durationMinutes?: number;

  description?: string | null;

  userName?: string | null;
  createdAt?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
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
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function unwrapList<T>(
  result: T[] | ApiResponse<T[]>
): T[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
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

/* =========================
   COMMENTS
========================= */

export async function getTaskComments(
  taskId: string
): Promise<CommentItem[]> {
  const endpoints = [
    `${API_URL}/api/Comments/task/${taskId}`,
    `${API_URL}/api/Comment/task/${taskId}`,
    `${API_URL}/api/Tasks/${taskId}/comments`,
    `${API_URL}/api/Task/${taskId}/comments`,
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
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Yorumları görüntülemek için yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response)
      );
    }

    const result:
      | CommentItem[]
      | ApiResponse<CommentItem[]> =
      await response.json();

    return unwrapList(result);
  }

  return [];
}

export async function addTaskComment(
  taskId: string,
  content: string
): Promise<void> {
  const endpoints = [
    `${API_URL}/api/Comments`,
    `${API_URL}/api/Comment`,
    `${API_URL}/api/Tasks/${taskId}/comments`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getHeaders(true),

      body: JSON.stringify({
        taskId,
        content,
      }),
    });

    if (response.status === 404) {
      continue;
    }

    if (response.status === 401) {
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Yorum eklemek için yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response)
      );
    }

    return;
  }

  throw new Error(
    "Comments endpointi bulunamadı."
  );
}

/* =========================
   TASK HISTORY
========================= */

export async function getTaskHistory(
  taskId: string
): Promise<TaskHistoryItem[]> {
  const endpoints = [
    `${API_URL}/api/TaskHistory/task/${taskId}`,
    `${API_URL}/api/TaskHistories/task/${taskId}`,
    `${API_URL}/api/Tasks/${taskId}/history`,
    `${API_URL}/api/Task/${taskId}/history`,
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
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (response.status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response)
      );
    }

    const result:
      | TaskHistoryItem[]
      | ApiResponse<TaskHistoryItem[]> =
      await response.json();

    return unwrapList(result);
  }

  return [];
}

/* =========================
   TIME LOG
========================= */

export async function getTaskTimeLogs(
  taskId: string
): Promise<TimeLogItem[]> {
  const endpoints = [
    `${API_URL}/api/TaskTimeLogs/task/${taskId}`,
    `${API_URL}/api/TimeLogs/task/${taskId}`,
    `${API_URL}/api/Tasks/${taskId}/time-logs`,
    `${API_URL}/api/Task/${taskId}/time-logs`,
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
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (response.status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response)
      );
    }

    const result:
      | TimeLogItem[]
      | ApiResponse<TimeLogItem[]> =
      await response.json();

    return unwrapList(result);
  }

  return [];
}

export async function addTaskTimeLog(
  taskId: string,
  minutes: number,
  description: string
): Promise<void> {
  const endpoints = [
    `${API_URL}/api/TaskTimeLogs`,
    `${API_URL}/api/TimeLogs`,
    `${API_URL}/api/Tasks/${taskId}/time-logs`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getHeaders(true),

      body: JSON.stringify({
        taskId,
        minutes,
        durationMinutes: minutes,
        description,
      }),
    });

    if (response.status === 404) {
      continue;
    }

    if (response.status === 401) {
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Çalışma süresi eklemek için yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response)
      );
    }

    return;
  }

  throw new Error(
    "Time Log endpointi bulunamadı."
  );
}