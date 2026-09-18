import {
  getStoredToken,
} from "./authService";

/* =========================================================
   TYPES
   ========================================================= */

export interface DashboardSummary {
  /*
   * Proje sayıları
   */
  totalProjects: number;

  activeProjects: number;

  completedProjects: number;

  /*
   * Görev sayıları
   */
  totalTasks: number;

  todoTasks: number;

  inProgressTasks: number;

  inReviewTasks: number;

  completedTasks: number;

  overdueTasks: number;

  assignedToMeTasks: number;

  completionPercentage: number;
}

/* =========================================================
   API
   ========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

/* =========================================================
   HEADERS
   ========================================================= */

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

/* =========================================================
   SUMMARY
   ========================================================= */

export async function getDashboardSummary():
  Promise<DashboardSummary> {
  const response =
    await fetch(
      `${API_URL}/api/dashboard/summary`,
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
      "Dashboard verilerini görüntüleme yetkiniz bulunmuyor."
    );
  }

  if (!response.ok) {
    let message =
      `Dashboard verileri alınamadı. (${response.status})`;

    try {
      const result =
        await response.json();

      message =
        result?.message ||
        result?.title ||
        message;
    } catch {
      // JSON hata cevabı gelmediyse
      // varsayılan mesaj kullanılır.
    }

    throw new Error(
      message
    );
  }

  const result =
    await response.json();

  return {
    totalProjects:
      Number(
        result.totalProjects ??
        0
      ),

    activeProjects:
      Number(
        result.activeProjects ??
        0
      ),

    completedProjects:
      Number(
        result.completedProjects ??
        0
      ),

    totalTasks:
      Number(
        result.totalTasks ??
        0
      ),

    todoTasks:
      Number(
        result.todoTasks ??
        0
      ),

    inProgressTasks:
      Number(
        result.inProgressTasks ??
        0
      ),

    inReviewTasks:
      Number(
        result.inReviewTasks ??
        0
      ),

    completedTasks:
      Number(
        result.completedTasks ??
        0
      ),

    overdueTasks:
      Number(
        result.overdueTasks ??
        0
      ),

    assignedToMeTasks:
      Number(
        result.assignedToMeTasks ??
        0
      ),

    completionPercentage:
      Number(
        result.completionPercentage ??
        0
      ),
  };
}