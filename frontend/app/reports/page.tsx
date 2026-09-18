"use client";

import { useEffect, useState } from "react";

import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/services/dashboardService";

const EMPTY_DATA: DashboardSummary = {
  totalProjects: 0,
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  inReviewTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  assignedToMeTasks: 0,
  completionPercentage: 0,
};

export default function ReportsPage() {
  const [data, setData] =
    useState<DashboardSummary>(
      EMPTY_DATA
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getDashboardSummary();

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Rapor verileri alınamadı."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const activeTasks =
    data.todoTasks +
    data.inProgressTasks +
    data.inReviewTasks;

  const taskCompletionPercentage =
    data.totalTasks > 0
      ? Math.round(
          (data.completedTasks /
            data.totalTasks) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 dark:bg-[#080b10]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#2f6f75]">
            Flow
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">
            Raporlar
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Proje ve görev performanslarını inceleyin.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-14 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-[#10141b] dark:text-gray-400">
            Raporlar hazırlanıyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#10141b]">
                <p className="text-sm text-gray-400">
                  Toplam Proje
                </p>

                <p className="mt-3 text-3xl font-semibold text-gray-950 dark:text-white">
                  {data.totalProjects}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#10141b]">
                <p className="text-sm text-gray-400">
                  Görev Tamamlanma
                </p>

                <p className="mt-3 text-3xl font-semibold text-gray-950 dark:text-white">
                  {data.completedTasks} /{" "}
                  {data.totalTasks}
                </p>
              </div>

              <div className="rounded-3xl border border-[#2f6f75]/30 bg-[#2f6f75] p-6 text-white">
                <p className="text-sm text-white/70">
                  Aktif Görev
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {activeTasks}
                </p>

                <p className="mt-2 text-xs text-white/65">
                  Yapılacak + devam eden + incelemede
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#10141b]">
                <p className="text-sm text-gray-400">
                  Bana Atanan
                </p>

                <p className="mt-3 text-2xl font-semibold text-gray-950 dark:text-white">
                  {
                    data.assignedToMeTasks
                  }
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#10141b]">
                <p className="text-sm text-gray-400">
                  Geciken Görev
                </p>

                <p className="mt-3 text-2xl font-semibold text-red-600 dark:text-red-400">
                  {data.overdueTasks}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#10141b]">
                <p className="text-sm text-gray-400">
                  Tamamlanma Oranı
                </p>

                <p className="mt-3 text-2xl font-semibold text-gray-950 dark:text-white">
                  {
                    data.completionPercentage
                  }
                  %
                </p>
              </div>
            </div>

            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-[#10141b]">
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Genel Performans
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Dashboard verileri üzerinden görev performansı özeti.
              </p>

              <div className="mt-8 space-y-7">
                <div>
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      Görev tamamlanma
                    </span>

                    <span>
                      {
                        data.completedTasks
                      }{" "}
                      tamamlandı
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-[#2f6f75] transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            taskCompletionPercentage
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    {
                      taskCompletionPercentage
                    }
                    % tamamlandı
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      Görev dağılımı
                    </span>

                    <span>
                      {data.totalTasks} toplam
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-[#0b0f15]">
                      <p className="text-xs text-gray-400">
                        Yapılacak
                      </p>

                      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        {
                          data.todoTasks
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-[#0b0f15]">
                      <p className="text-xs text-gray-400">
                        Devam Ediyor
                      </p>

                      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        {
                          data.inProgressTasks
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-[#0b0f15]">
                      <p className="text-xs text-gray-400">
                        İncelemede
                      </p>

                      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        {
                          data.inReviewTasks
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}