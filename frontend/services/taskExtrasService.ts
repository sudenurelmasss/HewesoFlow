import {
  getStoredToken,
} from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

export interface CommentItem {
  id: string;

  content: string;

  projectTaskId?: string;
  projectTaskTitle?: string;

  userId: string;
  userFullName: string;

  recipientUserId?: string | null;
  recipientUserFullName?: string | null;

  isPrivate?: boolean;

  createdAt: string;
  updatedAt?: string | null;
}

export interface ChecklistItem {
  id: string;

  projectTaskId: string;

  title: string;

  isCompleted: boolean;

  sortOrder: number;

  completedAt?: string | null;
}

export interface AttachmentItem {
  id: string;

  projectTaskId: string;

  uploadedByUserId: string;
  uploadedByUserName: string;

  originalFileName: string;

  contentType: string;

  fileSize: number;

  createdAt: string;
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
    `İstek başarısız (${response.status}).`;

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

export async function getTaskComments(
  taskId: string
): Promise<CommentItem[]> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/comments`,
      {
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

  return response.json();
}

export async function addTaskComment(
  taskId: string,
  content: string,
  recipientUserId?: string | null
): Promise<CommentItem> {
  const value =
    content.trim();

  if (!value) {
    throw new Error(
      "Yorum boş bırakılamaz."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/comments`,
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

  return response.json();
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<CommentItem> {
  const response =
    await fetch(
      `${API_URL}/api/comments/${commentId}`,
      {
        method: "PUT",

        headers:
          headers(true),

        body:
          JSON.stringify({
            content:
              content.trim(),
          }),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  return response.json();
}

export async function deleteComment(
  commentId: string
): Promise<void> {
  const response =
    await fetch(
      `${API_URL}/api/comments/${commentId}`,
      {
        method: "DELETE",

        headers:
          headers(),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }
}

export async function getChecklist(
  taskId: string
): Promise<ChecklistItem[]> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/checklist`,
      {
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

  return response.json();
}

export async function addChecklistItem(
  taskId: string,
  title: string,
  sortOrder = 0
): Promise<ChecklistItem> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/checklist`,
      {
        method: "POST",

        headers:
          headers(true),

        body:
          JSON.stringify({
            title:
              title.trim(),

            sortOrder,
          }),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  return response.json();
}

export async function updateChecklistItem(
  taskId: string,
  item: ChecklistItem,
  patch: Partial<
    Pick<
      ChecklistItem,
      | "title"
      | "isCompleted"
      | "sortOrder"
    >
  >
): Promise<ChecklistItem> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/checklist/${item.id}`,
      {
        method: "PATCH",

        headers:
          headers(true),

        body:
          JSON.stringify({
            title:
              patch.title ??
              item.title,

            isCompleted:
              patch.isCompleted ??
              item.isCompleted,

            sortOrder:
              patch.sortOrder ??
              item.sortOrder,
          }),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  return response.json();
}

export async function deleteChecklistItem(
  taskId: string,
  itemId: string
): Promise<void> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/checklist/${itemId}`,
      {
        method: "DELETE",

        headers:
          headers(),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }
}

export async function getAttachments(
  taskId: string
): Promise<AttachmentItem[]> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/attachments`,
      {
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

  return response.json();
}

export async function uploadAttachment(
  taskId: string,
  file: File,
  description: string
): Promise<AttachmentItem> {
  const token =
    getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı."
    );
  }

  const form =
    new FormData();

  if (!description.trim()) {
    throw new Error(
      "Dosya açıklaması zorunludur."
    );
  }

  const isPdf =
    file.type ===
      "application/pdf" ||
    file.name
      .toLowerCase()
      .endsWith(".pdf");

  if (!isPdf) {
    throw new Error(
      "Yalnızca PDF formatında dosya yüklenebilir."
    );
  }

  form.append(
    "file",
    file
  );

  form.append(
    "description",
    description.trim()
  );

  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/attachments`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body:
          form,
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  return response.json();
}

export async function deleteAttachment(
  taskId: string,
  attachmentId: string
): Promise<void> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/attachments/${attachmentId}`,
      {
        method: "DELETE",

        headers:
          headers(),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }
}

export async function downloadAttachment(
  taskId: string,
  attachment: AttachmentItem
): Promise<void> {
  const response =
    await fetch(
      `${API_URL}/api/tasks/${taskId}/attachments/${attachment.id}/download`,
      {
        headers:
          headers(),
      }
    );

  if (!response.ok) {
    return fail(
      response
    );
  }

  const blob =
    await response.blob();

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    attachment.originalFileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}