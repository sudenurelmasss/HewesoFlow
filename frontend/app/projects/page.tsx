"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  getProjects,
  Project,
} from "@/services/projectService";
import { getStoredToken } from "@/services/authService";

type JwtPayload = {
  role?: string;
  roles?: string[];
  [key: string]:
    | string
    | string[]
    | number
    | boolean
    | undefined;
};

function decodeJwtPayload(
  token: string
): JwtPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = decodeURIComponent(
      window
        .atob(payload)
        .split("")
        .map(
          (char) =>
            "%" +
            (
              "00" +
              char.charCodeAt(0).toString(16)
            ).slice(-2)
        )
        .join("")
    );

    return JSON.parse(decoded);
  } catch (error) {
    console.error(
      "Token çözümlenemedi:",
      error
    );

    return null;
  }
}

function getRoleFromToken(): string {
  const token = getStoredToken();

  if (!token) {
    return "";
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return "";
  }

  if (typeof payload.role === "string") {
    return payload.role;
  }

  if (
    Array.isArray(payload.roles) &&
    payload.roles.length > 0
  ) {
    return payload.roles[0];
  }

  const microsoftRoleClaim =
    payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ];

  if (
    typeof microsoftRoleClaim === "string"
  ) {
    return microsoftRoleClaim;
  }

  if (
    Array.isArray(microsoftRoleClaim) &&
    microsoftRoleClaim.length > 0
  ) {
    return microsoftRoleClaim[0];
  }

  return "";
}

function formatDate(
  date?: string | null
) {
  if (!date) {
    return "Belirtilmedi";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return "Belirtilmedi";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(parsedDate);
}

function getStatusText(
  status?: string | number
) {
  if (
    status === undefined ||
    status === null
  ) {
    return "Belirsiz";
  }

  if (typeof status === "string") {
    return status;
  }

  switch (status) {
    case 0:
      return "Planlama";

    case 1:
      return "Aktif";

    case 2:
      return "Tamamlandı";

    case 3:
      return "Beklemede";

    default:
      return `Durum ${status}`;
  }
}

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [role, setRole] =
    useState("");

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [endDate, setEndDate] =
    useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  const canCreateProject =
    useMemo(() => {
      const normalizedRole =
        role.toLowerCase();

      return (
        normalizedRole === "admin" ||
        normalizedRole ===
          "projectmanager"
      );
    }, [role]);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getProjects();

      setProjects(data);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Projeler yüklenirken beklenmeyen bir hata oluştu."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const currentRole =
      getRoleFromToken();

    setRole(currentRole);

    loadProjects();
  }, []);

  async function handleCreateProject(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setCreateError(
        "Proje adı zorunludur."
      );

      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      await createProject({
        name: name.trim(),
        description:
          description.trim(),
        startDate:
          startDate || null,
        endDate:
          endDate || null,
      });

      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");

      setShowCreateModal(false);

      await loadProjects();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setCreateError(
          error.message
        );
      } else {
        setCreateError(
          "Proje oluşturulurken bir hata oluştu."
        );
      }
    } finally {
      setCreating(false);
    }
  }

  function handleViewProject(
    projectId: string
  ) {
    if (!projectId) {
      console.error(
        "Proje ID bulunamadı."
      );

      return;
    }

    router.push(
      `/projects/${projectId}`
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              HewesoFlow
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Projeler
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Dahil olduğunuz
              projeleri görüntüleyin
              ve proje çalışmalarını
              yönetin.
            </p>
          </div>

          {canCreateProject && (
            <button
              type="button"
              onClick={() => {
                setCreateError("");
                setShowCreateModal(
                  true
                );
              }}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-80"
            >
              + Yeni Proje
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Toplam proje
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {projects.length}
            </p>
          </div>

          {role && (
            <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
              {role}
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Projeler
              yükleniyor...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">
            <p className="font-medium text-red-600">
              Projeler
              yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadProjects
              }
              className="mt-5 rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          projects.length ===
            0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                ◻
              </div>

              <h2 className="text-lg font-semibold">
                Henüz proje
                bulunmuyor
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                SQL Server
                tarafında
                görüntülenebilecek
                bir proje
                bulunamadı.
              </p>

              {canCreateProject && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      true
                    )
                  }
                  className="mt-6 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
                >
                  İlk Projeyi
                  Oluştur
                </button>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          projects.length >
            0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map(
                (project) => (
                  <article
                    key={
                      project.id
                    }
                    className="group rounded-3xl border border-gray-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-semibold text-white">
                        {project.name
                          ?.charAt(
                            0
                          )
                          .toUpperCase() ||
                          "P"}
                      </div>

                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                        {getStatusText(
                          project.status
                        )}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold">
                      {
                        project.name
                      }
                    </h2>

                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">
                      {project.description ||
                        "Bu proje için açıklama eklenmemiş."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                      <div>
                        <p className="text-xs text-gray-400">
                          Başlangıç
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-700">
                          {formatDate(
                            project.startDate
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Bitiş
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-700">
                          {formatDate(
                            project.endDate
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleViewProject(
                          project.id
                        )
                      }
                      className="mt-6 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
                    >
                      Projeyi
                      Görüntüle
                    </button>
                  </article>
                )
              )}
            </div>
          )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Yeni Proje
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Yeni bir
                  HewesoFlow
                  projesi
                  oluşturun.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleCreateProject
              }
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Proje adı
                </label>

                <input
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Örn. HewesoFlow"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Açıklama
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="Proje hakkında kısa açıklama..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Başlangıç
                    tarihi
                  </label>

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(
                      event
                    ) =>
                      setStartDate(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Bitiş tarihi
                  </label>

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEndDate(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              {createError && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-medium"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    creating
                  }
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Oluşturuluyor..."
                    : "Projeyi Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}