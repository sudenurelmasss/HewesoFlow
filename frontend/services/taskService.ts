import { getStoredToken } from "./authService";

export interface TaskItem {
  id: string;

  title: string;
  description?: string | null;

  status?: string | number;
  priority?: string | number;

  dueDate?: string | null;
  estimatedHours?: number | null;

  completedAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  projectId?: string | null;
  projectName?: string | null;

  assignedUserId?: string | null;
  assignedUserName?: string | null;
  assignedUserFullName?: string | null;

  createdByUserId?: string | null;
  createdByUserName?: string | null;
  createdByUserFullName?: string | null;

  isOverdue?: boolean;
  daysRemaining?: number | null;
}

export interface CreateTaskRequest {
  projectId: string;

  title: string;
  description?: string | null;

  assignedUserId?: string | null;

  priority: number;

  dueDate?: string | null;
  estimatedHours?: number | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

function getHeaders(contentType = false) {
  const token = getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı. Lütfen tekrar giriş yapın."
    );
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

async function getMessage(
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

function unwrapTaskResult(
  result:
    | TaskItem
    | ApiResponse<TaskItem>
): TaskItem | null {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    return result.data ?? null;
  }

  return result as TaskItem;
}

function unwrapTaskList(
  result:
    | TaskItem[]
    | ApiResponse<TaskItem[]>
): TaskItem[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

/* ===============================
   MY TASKS
================================ */

export async function getMyTasks(): Promise<
  TaskItem[]
> {
  const endpoints = [
    `${API_URL}/api/Tasks/my-tasks`,
    `${API_URL}/api/Tasks/my`,
    `${API_URL}/api/Tasks?quickFilter=assigned-to-me&page=1&pageSize=100`,
    `${API_URL}/api/Tasks`,
    `${API_URL}/api/Task/my-tasks`,
    `${API_URL}/api/Task`,
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
        "Görevleri görüntülemek için yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getMessage(response)
      );
    }

    const result:
      | TaskItem[]
      | ApiResponse<TaskItem[]> =
      await response.json();

    console.log(
      "Çalışan Tasks endpoint:",
      endpoint
    );

    return unwrapTaskList(result);
  }

  throw new Error(
    "Tasks endpointi bulunamadı."
  );
}

/* ===============================
   PROJECT TASKS
================================ */

export async function getProjectTasks(
  projectId: string
): Promise<TaskItem[]> {
  if (!projectId) {
    return [];
  }

  const endpoints = [
    `${API_URL}/api/Tasks?projectId=${encodeURIComponent(
      projectId
    )}&page=1&pageSize=100`,

    `${API_URL}/api/Tasks?ProjectId=${encodeURIComponent(
      projectId
    )}&Page=1&PageSize=100`,

    `${API_URL}/api/Tasks/project/${projectId}`,

    `${API_URL}/api/Task/project/${projectId}`,
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
        "Bu projenin görevlerini görüntüleme yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getMessage(response)
      );
    }

    const result:
      | TaskItem[]
      | ApiResponse<TaskItem[]> =
      await response.json();

    const tasks =
      unwrapTaskList(result);

    console.log(
      "Çalışan Project Tasks endpoint:",
      endpoint
    );

    return tasks.filter(
      (task) =>
        !task.projectId ||
        task.projectId.toLowerCase() ===
          projectId.toLowerCase()
    );
  }

  throw new Error(
    "Proje görevleri endpointi bulunamadı."
  );
}

/* ===============================
   CREATE TASK
================================ */

export async function createTask(
  request: CreateTaskRequest
): Promise<TaskItem | null> {
  if (!request.projectId) {
    throw new Error(
      "Proje bilgisi bulunamadı."
    );
  }

  if (!request.title.trim()) {
    throw new Error(
      "Görev başlığı zorunludur."
    );
  }

  if (request.title.trim().length < 3) {
    throw new Error(
      "Görev başlığı en az 3 karakter olmalıdır."
    );
  }

  const body = {
    projectId: request.projectId,

    title: request.title.trim(),

    description:
      request.description?.trim() ||
      null,

    assignedUserId:
      request.assignedUserId || null,

    priority: request.priority,

    dueDate:
      request.dueDate || null,

    estimatedHours:
      request.estimatedHours ??
      null,
  };

  const endpoints = [
    `${API_URL}/api/Tasks`,
    `${API_URL}/api/Task`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(body),
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
        "Bu projede görev oluşturma yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getMessage(response)
      );
    }

    if (
      response.status === 204
    ) {
      return null;
    }

    const text =
      await response.text();

    if (!text) {
      return null;
    }

    try {
      const result:
        | TaskItem
        | ApiResponse<TaskItem> =
        JSON.parse(text);

      console.log(
        "Çalışan Create Task endpoint:",
        endpoint
      );

      return unwrapTaskResult(
        result
      );
    } catch {
      return null;
    }
  }

  throw new Error(
    "Görev oluşturma endpointi bulunamadı."
  );
}

/* ===============================
   TASK DETAIL
================================ */

export async function getTaskById(
  id: string
): Promise<TaskItem | null> {
  if (!id) {
    return null;
  }

  const endpoints = [
    `${API_URL}/api/Tasks/${id}`,
    `${API_URL}/api/Task/${id}`,
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
        "Bu görevi görüntüleme yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getMessage(response)
      );
    }

    const result:
      | TaskItem
      | ApiResponse<TaskItem> =
      await response.json();

    return unwrapTaskResult(result);
  }

  return null;
}

/* ===============================
   TASK STATUS
================================ */

export async function updateTaskStatus(
  id: string,
  status: number
): Promise<void> {
  const attempts = [
    {
      url: `${API_URL}/api/Tasks/${id}/status`,
      method: "PATCH",
    },
    {
      url: `${API_URL}/api/Tasks/${id}/status`,
      method: "PUT",
    },
    {
      url: `${API_URL}/api/Task/${id}/status`,
      method: "PATCH",
    },
    {
      url: `${API_URL}/api/Task/${id}/status`,
      method: "PUT",
    },
  ];

  for (const attempt of attempts) {
    const response = await fetch(
      attempt.url,
      {
        method: attempt.method,
        headers: getHeaders(true),

        body: JSON.stringify({
          status,
        }),
      }
    );

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
        "Görev durumunu değiştirme yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        await getMessage(response)
      );
    }

    return;
  }

  throw new Error(
    "Görev durumu endpointi bulunamadı."
  );
}