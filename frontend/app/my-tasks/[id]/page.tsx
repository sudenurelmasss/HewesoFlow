"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getTaskById,
  TaskItem,
  updateTaskStatus,
} from "@/services/taskService";

function formatDate(value?: string | null) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [task, setTask] =
    useState<TaskItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState("");

  async function loadTask() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getTaskById(id);

      if (!result) {
        setError(
          "Görev bulunamadı."
        );

        return;
      }

      setTask(result);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Görev yüklenemedi."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  async function handleStatusChange(
    status: number
  ) {
    try {
      setChangingStatus(true);
      setStatusError("");

      await updateTaskStatus(
        id,
        status
      );

      await loadTask();
    } catch (error) {
      if (error instanceof Error) {
        setStatusError(
          error.message
        );
      } else {
        setStatusError(
          "Görev durumu değiştirilemedi."
        );
      }
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-14 text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Görev yükleniyor...
            </p>

          </div>
        </div>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">

        <div className="mx-auto max-w-6xl">

          <button
            onClick={() =>
              router.push(
                "/my-tasks"
              )
            }
            className="mb-6 text-sm font-medium text-gray-500 hover:text-black"
          >
            ← Görevlerime dön
          </button>

          <div className="rounded-3xl border border-red-200 bg-white p-8">

            <p className="font-medium text-red-600">
              Görev açılamadı
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">

      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <button
          onClick={() =>
            router.push(
              "/my-tasks"
            )
          }
          className="mb-7 text-sm font-medium text-gray-500 transition hover:text-black"
        >
          ← Görevlerime dön
        </button>

        {/* MAIN TASK */}

        <section className="rounded-[32px] border border-gray-200 bg-white p-8">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">

            <div className="max-w-3xl">

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Görev
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {task.title}
              </h1>

              <p className="mt-4 text-sm leading-7 text-gray-500">
                {task.description ||
                  "Bu görev için açıklama eklenmemiş."}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                {getStatusText(
                  task.status
                )}
              </span>

              <span className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600">
                {getPriorityText(
                  task.priority
                )}
              </span>

            </div>

          </div>

          {/* INFO */}

          <div className="mt-9 grid gap-5 border-t border-gray-100 pt-7 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Proje
              </p>

              <p className="mt-2 text-sm font-medium">
                {task.projectName ||
                  "Belirtilmedi"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Atanan Kişi
              </p>

              <p className="mt-2 text-sm font-medium">
                {task.assignedUserName ||
                  "Belirtilmedi"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Son Tarih
              </p>

              <p className="mt-2 text-sm font-medium">
                {formatDate(
                  task.dueDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Öncelik
              </p>

              <p className="mt-2 text-sm font-medium">
                {getPriorityText(
                  task.priority
                )}
              </p>
            </div>

          </div>
        </section>

        {/* GRID */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* STATUS */}

          <section className="rounded-3xl border border-gray-200 bg-white p-6">

            <h2 className="text-lg font-semibold">
              Görev Durumu
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Görevin ilerleme durumunu değiştirin.
            </p>

            <div className="mt-6 space-y-3">

              <button
                disabled={
                  changingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    0
                  )
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
              >
                Yapılacak
              </button>

              <button
                disabled={
                  changingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    1
                  )
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
              >
                Devam Ediyor
              </button>

              <button
                disabled={
                  changingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    2
                  )
                }
                className="w-full rounded-2xl bg-black px-4 py-3 text-left text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-50"
              >
                Tamamlandı
              </button>

            </div>

            {statusError && (
              <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
                {statusError}
              </div>
            )}

          </section>

          {/* COMMENTS */}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 lg:col-span-2">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Yorumlar
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Görev üzerindeki ekip konuşmaları.
                </p>
              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-10 text-center">

              <p className="text-sm font-medium">
                Yorum API bağlantısı sıradaki aşama
              </p>

              <p className="mt-2 text-xs text-gray-500">
                CommentsController bu alana bağlanacak.
              </p>

            </div>

          </section>

        </div>

        {/* SECOND ROW */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <section className="rounded-3xl border border-gray-200 bg-white p-6">

            <h2 className="text-lg font-semibold">
              Çalışma Süresi
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Görev için harcanan süreler burada görüntülenecek.
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-7 text-center">

              <p className="text-2xl font-semibold">
                —
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Time Log
              </p>

            </div>

          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6">

            <h2 className="text-lg font-semibold">
              Görev Geçmişi
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Görev üzerinde yapılan değişiklikler.
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-7 text-center">

              <p className="text-sm font-medium">
                Henüz aktivite yok
              </p>

            </div>

          </section>

        </div>

      </div>
    </main>
  );
}