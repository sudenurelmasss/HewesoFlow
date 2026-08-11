"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/services/dashboardService";

export default function ReportsPage() {
  const [data, setData] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getDashboardSummary();

        setData({
          totalProjects: result.totalProjects ?? 0,
          activeProjects: result.activeProjects ?? 0,
          completedProjects: result.completedProjects ?? 0,
          totalTasks: result.totalTasks ?? 0,
          activeTasks: result.activeTasks ?? 0,
          completedTasks: result.completedTasks ?? 0,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            HewesoFlow
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Raporlar
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Proje ve görev performanslarını inceleyin.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-14 text-center">
            Raporlar hazırlanıyor...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-sm text-gray-400">
                  Proje Tamamlanma
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {data.completedProjects} / {data.totalProjects}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-sm text-gray-400">
                  Görev Tamamlanma
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {data.completedTasks} / {data.totalTasks}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-black p-6 text-white">
                <p className="text-sm text-gray-400">
                  Aktif Görev
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {data.activeTasks}
                </p>
              </div>

            </div>

            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8">
              <h2 className="text-lg font-semibold">
                Genel Performans
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Dashboard API üzerinden alınan sistem özeti.
              </p>

              <div className="mt-8 space-y-6">

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Projeler</span>
                    <span>
                      {data.completedProjects} tamamlandı
                    </span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-black"
                      style={{
                        width:
                          data.totalProjects === 0
                            ? "0%"
                            : `${
                                (data.completedProjects /
                                  data.totalProjects) *
                                100
                              }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Görevler</span>
                    <span>
                      {data.completedTasks} tamamlandı
                    </span>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-black"
                      style={{
                        width:
                          data.totalTasks === 0
                            ? "0%"
                            : `${
                                (data.completedTasks /
                                  data.totalTasks) *
                                100
                              }%`,
                      }}
                    />
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