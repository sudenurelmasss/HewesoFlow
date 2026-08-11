"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getMyTasks,
  TaskItem,
} from "@/services/taskService";

function getStatusText(status?: string | number) {
  if (typeof status === "string") {
    return status;
  }

  switch (status) {
    case 0:
      return "Yapılacak";

    case 1:
      return "Devam Ediyor";

    case 2:
      return "Tamamlandı";

    case 3:
      return "Beklemede";

    default:
      return "Belirsiz";
  }
}

function getPriorityText(priority?: string | number) {
  if (typeof priority === "string") {
    return priority;
  }

  switch (priority) {
    case 0:
      return "Düşük";

    case 1:
      return "Normal";

    case 2:
      return "Yüksek";

    case 3:
      return "Acil";

    default:
      return "Normal";
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const result = await getMyTasks();

      setTasks(result);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Görevler yüklenirken bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return tasks.filter((task) => {
      const text = `
        ${task.title}
        ${task.description ?? ""}
        ${task.projectName ?? ""}
      `.toLowerCase();

      if (searchValue && !text.includes(searchValue)) {
        return false;
      }

      if (filter === "all") {
        return true;
      }

      const status = getStatusText(task.status).toLowerCase();

      if (filter === "todo") {
        return (
          status.includes("yapılacak") ||
          status.includes("todo")
        );
      }

      if (filter === "progress") {
        return (
          status.includes("devam") ||
          status.includes("progress")
        );
      }

      if (filter === "completed") {
        return (
          status.includes("tamam") ||
          status.includes("completed")
        );
      }

      return true;
    });
  }, [tasks, filter, search]);

  const completedCount = tasks.filter((task) => {
    const status = getStatusText(task.status).toLowerCase();

    return (
      status.includes("tamam") ||
      status.includes("completed")
    );
  }).length;

  const activeCount = tasks.length - completedCount;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Görevlerim
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Size atanmış görevleri görüntüleyin ve çalışmalarınızı
            takip edin.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Toplam Görev
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Aktif
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {activeCount}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Tamamlandı
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {completedCount}
            </p>
          </div>

        </div>

        {/* SEARCH + FILTER */}

        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Görev veya proje ara..."
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm outline-none md:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 text-sm ${
                filter === "all"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Tümü
            </button>

            <button
              onClick={() => setFilter("todo")}
              className={`rounded-xl px-4 py-2 text-sm ${
                filter === "todo"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Yapılacak
            </button>

            <button
              onClick={() => setFilter("progress")}
              className={`rounded-xl px-4 py-2 text-sm ${
                filter === "progress"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Devam Ediyor
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`rounded-xl px-4 py-2 text-sm ${
                filter === "completed"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Tamamlananlar
            </button>

          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-14 text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Görevler yükleniyor...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">

            <p className="font-medium text-red-600">
              Görevler yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadTasks}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm text-white"
            >
              Tekrar Dene
            </button>

          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && tasks.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl">
              ✓
            </div>

            <h2 className="text-lg font-semibold">
              Henüz görev bulunmuyor
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Şu anda hesabınıza atanmış bir görev bulunmuyor.
            </p>

          </div>
        )}

        {/* SEARCH EMPTY */}

        {!loading &&
          !error &&
          tasks.length > 0 &&
          filteredTasks.length === 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

              <p className="font-medium">
                Sonuç bulunamadı
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Arama veya filtre kriterlerinizi değiştirin.
              </p>

            </div>
          )}

        {/* TASK LIST */}

        {!loading &&
          !error &&
          filteredTasks.length > 0 && (
            <div className="space-y-4">

              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    <div className="flex-1">

                      <div className="mb-3 flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {getStatusText(task.status)}
                        </span>

                        <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
                          {getPriorityText(task.priority)}
                        </span>

                      </div>

                      <h2 className="text-lg font-semibold">
                        {task.title}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                        {task.description ||
                          "Bu görev için açıklama bulunmuyor."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-6 text-xs text-gray-400">

                        <div>
                          Proje:{" "}
                          <span className="font-medium text-gray-700">
                            {task.projectName || "Belirtilmedi"}
                          </span>
                        </div>

                        <div>
                          Son tarih:{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                      </div>

                    </div>

                    <a
                      href={`/my-tasks/${task.id}`}
                      className="rounded-2xl border border-gray-200 px-5 py-3 text-center text-sm font-medium transition hover:bg-gray-50"
                    >
                      Görevi Aç
                    </a>

                  </div>

                </article>
              ))}

            </div>
          )}

      </div>
    </main>
  );
}