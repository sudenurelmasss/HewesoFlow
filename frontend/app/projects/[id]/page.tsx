"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getProjectById,
  Project,
} from "@/services/projectService";

import {
  createTask,
  getProjectTasks,
  TaskItem,
} from "@/services/taskService";

import {
  getProjectMembers,
  getProjectMemberRole,
  ProjectMember,
} from "@/services/projectMemberService";

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
              char
                .charCodeAt(0)
                .toString(16)
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

  const payload =
    decodeJwtPayload(token);

  if (!payload) {
    return "";
  }

  if (
    typeof payload.role === "string"
  ) {
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
    typeof microsoftRoleClaim ===
    "string"
  ) {
    return microsoftRoleClaim;
  }

  if (
    Array.isArray(
      microsoftRoleClaim
    ) &&
    microsoftRoleClaim.length > 0
  ) {
    return microsoftRoleClaim[0];
  }

  return "";
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Belirtilmedi";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatShortDate(
  value?: string | null
) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getProjectStatus(
  status?: string | number
) {
  if (
    typeof status === "string"
  ) {
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

    case 4:
      return "İptal";

    default:
      return "Belirsiz";
  }
}

function getTaskStatus(
  status?: string | number
) {
  if (
    typeof status === "string"
  ) {
    return status;
  }

  switch (status) {
    case 0:
      return "Yapılacak";

    case 1:
      return "Devam Ediyor";

    case 2:
      return "İncelemede";

    case 3:
      return "Tamamlandı";

    default:
      return "Belirsiz";
  }
}

function getPriority(
  priority?: string | number
) {
  if (
    typeof priority === "string"
  ) {
    return priority;
  }

  switch (priority) {
    case 0:
      return "Düşük";

    case 1:
      return "Orta";

    case 2:
      return "Yüksek";

    case 3:
      return "Kritik";

    default:
      return "Belirsiz";
  }
}

function getMemberName(
  member: ProjectMember
) {
  if (member.fullName?.trim()) {
    return member.fullName.trim();
  }

  const name = [
    member.firstName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (name) {
    return name;
  }

  if (member.email?.trim()) {
    return member.email.trim();
  }

  return "İsimsiz kullanıcı";
}

function getMemberInitials(
  member: ProjectMember
) {
  const name =
    getMemberName(member);

  const parts = name
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    params.id as string;

  const [
    project,
    setProject,
  ] = useState<Project | null>(
    null
  );

  const [tasks, setTasks] =
    useState<TaskItem[]>([]);

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [role, setRole] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    tasksLoading,
    setTasksLoading,
  ] = useState(true);

  const [
    membersLoading,
    setMembersLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    tasksError,
    setTasksError,
  ] = useState("");

  const [
    membersError,
    setMembersError,
  ] = useState("");

  const [
    showTaskModal,
    setShowTaskModal,
  ] = useState(false);

  const [
    taskTitle,
    setTaskTitle,
  ] = useState("");

  const [
    taskDescription,
    setTaskDescription,
  ] = useState("");

  const [
    taskPriority,
    setTaskPriority,
  ] = useState("1");

  const [
    taskDueDate,
    setTaskDueDate,
  ] = useState("");

  const [
    estimatedHours,
    setEstimatedHours,
  ] = useState("");

  const [
    selectedAssignedUserId,
    setSelectedAssignedUserId,
  ] = useState("");

  const [
    creatingTask,
    setCreatingTask,
  ] = useState(false);

  const [
    createTaskError,
    setCreateTaskError,
  ] = useState("");

  const canCreateTask =
    useMemo(() => {
      const normalized =
        role.toLowerCase();

      return (
        normalized === "admin" ||
        normalized ===
          "projectmanager"
      );
    }, [role]);

  async function loadProject() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getProjectById(id);

      if (!result) {
        setError(
          "Proje bulunamadı."
        );

        return;
      }

      setProject(result);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setError(error.message);
      } else {
        setError(
          "Proje yüklenemedi."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    try {
      setTasksLoading(true);
      setTasksError("");

      const result =
        await getProjectTasks(id);

      setTasks(result);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setTasksError(
          error.message
        );
      } else {
        setTasksError(
          "Görevler yüklenemedi."
        );
      }
    } finally {
      setTasksLoading(false);
    }
  }

  async function loadMembers() {
    try {
      setMembersLoading(true);
      setMembersError("");

      const result =
        await getProjectMembers(id);

      setMembers(result);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setMembersError(
          error.message
        );
      } else {
        setMembersError(
          "Proje üyeleri yüklenemedi."
        );
      }
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    const currentRole =
      getRoleFromToken();

    setRole(currentRole);

    loadProject();
    loadTasks();
    loadMembers();
  }, [id]);

  function openTaskModal() {
    setCreateTaskError("");
    setSelectedAssignedUserId("");
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    if (creatingTask) {
      return;
    }

    setShowTaskModal(false);
    setCreateTaskError("");
  }

  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!taskTitle.trim()) {
      setCreateTaskError(
        "Görev başlığı zorunludur."
      );

      return;
    }

    if (
      taskTitle.trim().length < 3
    ) {
      setCreateTaskError(
        "Görev başlığı en az 3 karakter olmalıdır."
      );

      return;
    }

    let hours:
      | number
      | null = null;

    if (
      estimatedHours.trim()
    ) {
      hours = Number(
        estimatedHours
      );

      if (
        Number.isNaN(hours) ||
        hours < 0
      ) {
        setCreateTaskError(
          "Tahmini süre geçerli bir sayı olmalıdır."
        );

        return;
      }
    }

    try {
      setCreatingTask(true);
      setCreateTaskError("");

      await createTask({
        projectId: id,

        title:
          taskTitle.trim(),

        description:
          taskDescription.trim() ||
          null,

        assignedUserId:
          selectedAssignedUserId ||
          null,

        priority: Number(
          taskPriority
        ),

        dueDate:
          taskDueDate || null,

        estimatedHours:
          hours,
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("1");
      setTaskDueDate("");
      setEstimatedHours("");
      setSelectedAssignedUserId("");

      setShowTaskModal(false);

      await loadTasks();
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setCreateTaskError(
          error.message
        );
      } else {
        setCreateTaskError(
          "Görev oluşturulamadı."
        );
      }
    } finally {
      setCreatingTask(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Proje yükleniyor...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !project
  ) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/projects"
              )
            }
            className="mb-6 text-sm font-medium text-gray-500 transition hover:text-black"
          >
            ← Projelere dön
          </button>

          <div className="rounded-3xl border border-red-200 bg-white p-8">
            <p className="font-medium text-red-600">
              Proje açılamadı
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
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/projects"
            )
          }
          className="mb-7 text-sm font-medium text-gray-500 transition hover:text-black"
        >
          ← Projelere dön
        </button>

        <section className="rounded-[32px] border border-gray-200 bg-white p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-semibold text-white">
                {project.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  "P"}
              </div>

              <p className="text-sm font-medium text-gray-400">
                PROJE
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500">
                {project.description ||
                  "Bu proje için henüz açıklama eklenmemiş."}
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
              {getProjectStatus(
                project.status
              )}
            </span>
          </div>

          <div className="mt-10 grid gap-4 border-t border-gray-100 pt-7 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Başlangıç
              </p>

              <p className="mt-2 text-sm font-medium">
                {formatDate(
                  project.startDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Bitiş
              </p>

              <p className="mt-2 text-sm font-medium">
                {formatDate(
                  project.endDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Durum
              </p>

              <p className="mt-2 text-sm font-medium">
                {getProjectStatus(
                  project.status
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Proje ID
              </p>

              <p className="mt-2 truncate text-sm font-medium">
                {project.id}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 lg:col-span-2">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Görevler
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Bu projeye ait görevleri yönetin.
                </p>
              </div>

              {canCreateTask && (
                <button
                  type="button"
                  onClick={
                    openTaskModal
                  }
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-80"
                >
                  + Yeni Görev
                </button>
              )}
            </div>

            {tasksLoading && (
              <div className="rounded-2xl border border-gray-200 px-6 py-12 text-center">
                <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

                <p className="text-sm text-gray-500">
                  Görevler yükleniyor...
                </p>
              </div>
            )}

            {!tasksLoading &&
              tasksError && (
                <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
                  <p className="text-sm font-medium text-red-600">
                    Görevler yüklenemedi
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    {tasksError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadTasks
                    }
                    className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

            {!tasksLoading &&
              !tasksError &&
              tasks.length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    ✓
                  </div>

                  <p className="font-medium">
                    Henüz görev bulunmuyor
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Bu proje için henüz görev oluşturulmadı.
                  </p>

                  {canCreateTask && (
                    <button
                      type="button"
                      onClick={
                        openTaskModal
                      }
                      className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
                    >
                      İlk Görevi Oluştur
                    </button>
                  )}
                </div>
              )}

            {!tasksLoading &&
              !tasksError &&
              tasks.length > 0 && (
                <div className="space-y-3">
                  {tasks.map(
                    (task) => {
                      const assignedMember =
                        members.find(
                          (member) =>
                            member.userId ===
                            task.assignedUserId
                        );

                      const assignedName =
                        task.assignedUserFullName ||
                        task.assignedUserName ||
                        (assignedMember
                          ? getMemberName(
                              assignedMember
                            )
                          : null) ||
                        "Atanmamış";

                      return (
                        <button
                          key={
                            task.id
                          }
                          type="button"
                          onClick={() =>
                            router.push(
                              `/my-tasks/${task.id}`
                            )
                          }
                          className="w-full rounded-2xl border border-gray-200 p-5 text-left transition hover:border-gray-300 hover:bg-gray-50"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  {getTaskStatus(
                                    task.status
                                  )}
                                </span>

                                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                                  {getPriority(
                                    task.priority
                                  )}
                                </span>

                                {task.isOverdue && (
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                                    Gecikmiş
                                  </span>
                                )}
                              </div>

                              <h3 className="mt-3 text-base font-semibold">
                                {
                                  task.title
                                }
                              </h3>

                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                                {task.description ||
                                  "Bu görev için açıklama eklenmemiş."}
                              </p>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-xs text-gray-400">
                                Son teslim
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {formatShortDate(
                                  task.dueDate
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                            <span>
                              Atanan:{" "}
                              {
                                assignedName
                              }
                            </span>

                            <span>
                              Tahmini süre:{" "}
                              {task.estimatedHours !==
                                null &&
                              task.estimatedHours !==
                                undefined
                                ? `${task.estimatedHours} saat`
                                : "Belirtilmedi"}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Proje Ekibi
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Projeye dahil olan kullanıcılar.
                </p>
              </div>

              {!membersLoading &&
                !membersError && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {members.length}
                  </span>
                )}
            </div>

            {membersLoading && (
              <div className="mt-6 rounded-2xl border border-gray-200 px-5 py-8 text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

                <p className="text-sm text-gray-500">
                  Proje ekibi yükleniyor...
                </p>
              </div>
            )}

            {!membersLoading &&
              membersError && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-4">
                  <p className="text-sm font-medium text-red-600">
                    Ekip yüklenemedi
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    {membersError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadMembers
                    }
                    className="mt-3 rounded-xl bg-black px-4 py-2 text-xs font-medium text-white"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

            {!membersLoading &&
              !membersError &&
              members.length === 0 && (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-center">
                  <p className="text-sm font-medium">
                    Proje üyesi bulunmuyor
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Bu projeye henüz kullanıcı eklenmemiş.
                  </p>
                </div>
              )}

            {!membersLoading &&
              !membersError &&
              members.length > 0 && (
                <div className="mt-6 space-y-3">
                  {members.map(
                    (member) => (
                      <div
                        key={
                          member.id
                        }
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-semibold text-white">
                          {getMemberInitials(
                            member
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {getMemberName(
                              member
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-400">
                            {member.email}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {getProjectMemberRole(
                            member.role
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-400">
              Görev Sayısı
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {tasks.length}
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-400">
              Proje Üyesi
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {membersLoading
                ? "—"
                : members.length}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Aktif proje ekibi.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-400">
              Harcanan Süre
            </p>

            <p className="mt-3 text-2xl font-semibold">
              —
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Time Log ile bağlanacak.
            </p>
          </section>
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {project.name}
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Yeni Görev
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Bu proje için yeni bir görev oluşturun.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeTaskModal
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleCreateTask
              }
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Görev başlığı
                </label>

                <input
                  value={
                    taskTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskTitle(
                      event.target.value
                    )
                  }
                  placeholder="Örn. Login ekranını tamamla"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Açıklama
                </label>

                <textarea
                  value={
                    taskDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskDescription(
                      event.target.value
                    )
                  }
                  placeholder="Görev hakkında kısa açıklama..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Öncelik
                  </label>

                  <select
                    value={
                      taskPriority
                    }
                    onChange={(
                      event
                    ) =>
                      setTaskPriority(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  >
                    <option value="0">
                      Düşük
                    </option>

                    <option value="1">
                      Orta
                    </option>

                    <option value="2">
                      Yüksek
                    </option>

                    <option value="3">
                      Kritik
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tahmini süre
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={
                      estimatedHours
                    }
                    onChange={(
                      event
                    ) =>
                      setEstimatedHours(
                        event.target.value
                      )
                    }
                    placeholder="Örn. 4"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Teslim tarihi
                </label>

                <input
                  type="date"
                  value={
                    taskDueDate
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskDueDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Proje başlangıcı:{" "}
                  {formatDate(
                    project.startDate
                  )}
                  {" • "}
                  Proje bitişi:{" "}
                  {formatDate(
                    project.endDate
                  )}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Atanacak kişi
                </label>

                <select
                  value={
                    selectedAssignedUserId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedAssignedUserId(
                      event.target.value
                    )
                  }
                  disabled={
                    membersLoading
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">
                    Atama yapma
                  </option>

                  {members.map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.userId
                        }
                      >
                        {getMemberName(
                          member
                        )}
                      </option>
                    )
                  )}
                </select>

                {membersLoading && (
                  <p className="mt-2 text-xs text-gray-400">
                    Proje üyeleri yükleniyor...
                  </p>
                )}

                {membersError && (
                  <p className="mt-2 text-xs text-red-500">
                    {membersError}
                  </p>
                )}

                {!membersLoading &&
                  !membersError &&
                  members.length ===
                    0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      Bu projeye henüz kullanıcı eklenmemiş.
                    </p>
                  )}
              </div>

              {createTaskError && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {
                    createTaskError
                  }
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={
                    creatingTask
                  }
                  onClick={
                    closeTaskModal
                  }
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-medium disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingTask
                  }
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingTask
                    ? "Oluşturuluyor..."
                    : "Görevi Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}