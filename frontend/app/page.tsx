"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/services/dashboardService";

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const result = await getDashboardSummary();

      setSummary({
        totalProjects: result.totalProjects ?? 0,
        activeProjects: result.activeProjects ?? 0,
        completedProjects: result.completedProjects ?? 0,
        totalTasks: result.totalTasks ?? 0,
        activeTasks: result.activeTasks ?? 0,
        completedTasks: result.completedTasks ?? 0,
        totalUsers: result.totalUsers ?? 0,
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Proje ve görev çalışmalarınızın genel görünümü.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Dashboard yükleniyor...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">
            <p className="font-medium text-red-600">
              Dashboard yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm text-white"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Toplam Proje
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {summary.totalProjects}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Aktif Proje
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {summary.activeProjects}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Toplam Görev
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {summary.totalTasks}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-black p-6 text-white">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Tamamlanan Görev
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {summary.completedTasks}
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">

              <section className="rounded-3xl border border-gray-200 bg-white p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold">
                  Çalışma Özeti
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Proje ve görev durumlarının genel dağılımı.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Aktif Görev
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {summary.activeTasks}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      Tamamlanan Proje
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {summary.completedProjects}
                    </p>
                  </div>

                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  Hızlı Erişim
                </h2>

                <div className="mt-6 space-y-3">

                  <a
                    href="/projects"
                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                  >
                    Projeler
                  </a>

                  <a
                    href="/my-tasks"
                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                  >
                    Görevlerim
                  </a>

                  <a
                    href="/notifications"
                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                  >
                    Bildirimler
                  </a>

                </div>
              </section>

            </div>
          </>
        )}
      </div>
    </main>
  );
}