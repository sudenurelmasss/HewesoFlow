import { getStoredToken } from "./authService";

export interface DashboardSummary {
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;

  totalTasks?: number;
  activeTasks?: number;
  completedTasks?: number;

  totalUsers?: number;
  totalComments?: number;
  totalTimeLogs?: number;
}

interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

function getHeaders() {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const endpoints = [
    `${API_URL}/api/Dashboard`,
    `${API_URL}/api/Dashboard/summary`,
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
      throw new Error("Oturum süresi dolmuş olabilir.");
    }

    if (response.status === 403) {
      throw new Error(
        "Dashboard verilerini görüntüleme yetkiniz bulunmuyor."
      );
    }

    if (!response.ok) {
      throw new Error(
        `Dashboard verileri alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | DashboardSummary
      | ApiResponse<DashboardSummary> =
      await response.json();

    if ("data" in result && result.data) {
      return result.data;
    }

    return result as DashboardSummary;
  }

  return {};
}