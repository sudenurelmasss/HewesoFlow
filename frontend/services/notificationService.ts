import {
  getStoredToken,
} from "./authService";

/* =========================================================
   TYPES
   ========================================================= */

export interface NotificationItem {
  id: string;

  title?: string | null;

  message?: string | null;

  type?: string | number | null;

  isRead?: boolean;

  createdAt?: string | null;

  relatedEntityId?:
    string | null;

  relatedEntityType?:
    string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;

  message?: string;

  data?: T;
}

/* =========================================================
   ERRORS
   ========================================================= */

export class NotificationForbiddenError
  extends Error {
  constructor() {
    super(
      "FORBIDDEN"
    );

    this.name =
      "NotificationForbiddenError";
  }
}

/* =========================================================
   API
   ========================================================= */

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

/* =========================================================
   HEADERS
   ========================================================= */

function getHeaders(
  contentType = false
): HeadersInit {
  const token =
    getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı."
    );
  }

  return {
    ...(contentType
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    Accept:
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}

/* =========================================================
   UNWRAP
   ========================================================= */

function unwrapList(
  result:
    | NotificationItem[]
    | ApiResponse<
        NotificationItem[]
      >
): NotificationItem[] {
  if (
    Array.isArray(
      result
    )
  ) {
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

/* =========================================================
   GET NOTIFICATIONS
   ========================================================= */

export async function getNotifications():
  Promise<
    NotificationItem[]
  > {
  const endpoints = [
    `${API_URL}/api/Notifications`,
    `${API_URL}/api/Notification`,
  ];

  for (
    const endpoint
    of endpoints
  ) {
    const response =
      await fetch(
        endpoint,
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
      continue;
    }

    if (
      response.status ===
      401
    ) {
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new NotificationForbiddenError();
    }

    if (
      !response.ok
    ) {
      throw new Error(
        `Bildirimler alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | NotificationItem[]
      | ApiResponse<
          NotificationItem[]
        > =
      await response.json();

    return unwrapList(
      result
    );
  }

  return [];
}

/* =========================================================
   MARK AS READ
   ========================================================= */

export async function markNotificationAsRead(
  id: string
): Promise<void> {
  const endpoints = [
    `${API_URL}/api/Notifications/${id}/read`,
    `${API_URL}/api/Notification/${id}/read`,
  ];

  for (
    const endpoint
    of endpoints
  ) {
    const response =
      await fetch(
        endpoint,
        {
          method:
            "PUT",

          headers:
            getHeaders(
              true
            ),

          body:
            JSON.stringify(
              {}
            ),
        }
      );

    if (
      response.status ===
      404
    ) {
      continue;
    }

    if (
      response.status ===
      401
    ) {
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new NotificationForbiddenError();
    }

    if (
      !response.ok
    ) {
      throw new Error(
        `Bildirim güncellenemedi. Hata kodu: ${response.status}`
      );
    }

    return;
  }

  throw new Error(
    "Bildirim güncellenemedi."
  );
}