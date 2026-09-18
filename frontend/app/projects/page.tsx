"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  UserRound,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  createProject,
  getProjects,
  Project,
} from "@/services/projectService";

import {
  Department,
  getDepartments,
} from "@/services/departmentService";

import {
  getProjectManagerOptions,
  ProjectManagerOption,
} from "@/services/projectManagerOptionService";

import {
  getStoredToken,
} from "@/services/authService";

type JwtPayload = {
  sub?: string;
  role?: string;
  roles?: string[];

  [key: string]: unknown;
};

function decodeToken(
  token: string
): JwtPayload | null {
  try {
    const payload =
      token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return JSON.parse(
      decodeURIComponent(
        atob(normalized)
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
      )
    );
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const token =
    getStoredToken();

  if (!token) {
    return {
      role: "",
      userId: "",
    };
  }

  const payload =
    decodeToken(token);

  if (!payload) {
    return {
      role: "",
      userId: "",
    };
  }

  let role = "";

  if (
    typeof payload.role ===
    "string"
  ) {
    role = payload.role;
  }

  if (
    !role &&
    Array.isArray(payload.roles)
  ) {
    role =
      typeof payload.roles[0] ===
      "string"
        ? payload.roles[0]
        : "";
  }

  const microsoftRole =
    payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ];

  if (
    !role &&
    typeof microsoftRole ===
      "string"
  ) {
    role = microsoftRole;
  }

  const microsoftId =
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ];

  let userId = "";

  if (
    typeof microsoftId ===
    "string"
  ) {
    userId = microsoftId;
  } else if (
    typeof payload.sub ===
    "string"
  ) {
    userId = payload.sub;
  }

  return {
    role,
    userId,
  };
}

function normalizeRole(
  role: string
) {
  return role
    .replace(/\s/g, "")
    .toLowerCase();
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
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
  ).format(date);
}

function getStatusText(
  status?: string | number
) {
  if (
    typeof status ===
    "string"
  ) {
    const normalized =
      status
        .toLocaleLowerCase(
          "tr-TR"
        )
        .trim();

    if (
      normalized.includes(
        "reject"
      ) ||
      normalized.includes(
        "redd"
      ) ||
      normalized.includes(
        "iptal"
      )
    ) {
      return "Reddedildi";
    }

    if (
      normalized.includes(
        "complete"
      ) ||
      normalized.includes(
        "tamam"
      )
    ) {
      return "Tamamlandı";
    }

    return "Aktif";
  }

  switch (status) {
    case 2:
    case 4:
      return "Tamamlandı";

    case 5:
      return "Reddedildi";

    case 0:
    case 1:
    case 3:
    case 6:
    default:
      return "Aktif";
  }
}

function getStatusClasses(
  status?: string | number
) {
  const value =
    getStatusText(status)
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    value.includes("tamam")
  ) {
    return `
      border-emerald-300
      bg-emerald-50
      text-emerald-700

      dark:border-emerald-400/40
      dark:bg-emerald-400/10
      dark:text-emerald-300
    `;
  }

  if (
    value.includes("redd")
  ) {
    return `
      border-red-300
      bg-red-50
      text-red-600

      dark:border-red-400/40
      dark:bg-red-400/10
      dark:text-red-300
    `;
  }

  return `
    border-sky-300
    bg-sky-50
    text-sky-600

    dark:border-sky-400/40
    dark:bg-sky-400/10
    dark:text-sky-300
  `;
}

type DepartmentProjectGroupProps = {
  department: Department;
  projects: Project[];
  index: number;
};

function DepartmentProjectGroup({
  department,
  projects,
  index,
}: DepartmentProjectGroupProps) {
  const router =
    useRouter();

  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const visibleProjects =
    expanded
      ? projects
      : projects.slice(0, 5);

  const hasMore =
    projects.length > 5;

  /*
   * Açık temada yumuşak pastel.
   * Koyu temada panel koyu kalıyor,
   * yalnızca çerçeve neon vurgu taşıyor.
   */
  const departmentTheme =
    index % 3 === 0
      ? {
          header:
            "border-indigo-200 bg-indigo-50/75 dark:border-indigo-400/35 dark:bg-[#0b1424]",

          icon:
            "bg-indigo-100 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-1 dark:ring-indigo-400/30",

          panel:
            "dark:border-indigo-400/25",
        }
      : index % 3 === 1
        ? {
            header:
              "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/35 dark:bg-[#0b1420]",

            icon:
              "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/30",

            panel:
              "dark:border-emerald-400/25",
          }
        : {
            header:
              "border-orange-200 bg-orange-50/70 dark:border-orange-400/35 dark:bg-[#15120f]",

            icon:
              "bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-1 dark:ring-orange-400/30",

            panel:
              "dark:border-orange-400/25",
          };

  return (
    <section
      className={`
        overflow-hidden
        rounded-[26px]
        border
        border-white/90
        bg-white/82
        shadow-[0_10px_34px_rgba(15,23,42,0.045)]
        backdrop-blur-xl

        dark:bg-[#07111f]/95
        dark:shadow-[0_16px_45px_rgba(0,0,0,0.28)]
        ${departmentTheme.panel}
      `}
    >
      {/* =============================
          DEPARTMENT HEADER
      ============================== */}

      <div
        className={`
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
          border-b
          px-6
          py-5

          ${departmentTheme.header}
        `}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-[14px]

              ${departmentTheme.icon}
            `}
          >
            <Building2
              size={20}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="
                  truncate
                  text-[22px]
                  font-bold
                  tracking-[-0.035em]
                  text-gray-950

                  dark:text-white
                "
              >
                {
                  department.name
                }
              </h2>

              <span
                className="
                  rounded-[9px]
                  border
                  border-white/90
                  bg-white/80
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  text-gray-600

                  dark:border-slate-700
                  dark:bg-slate-900/80
                  dark:text-slate-300
                "
              >
                {
                  projects.length
                }{" "}
                proje
              </span>
            </div>

            <p
              className="
                mt-1
                text-[11px]
                font-medium
                text-gray-500

                dark:text-slate-400
              "
            >
              Departmana ait projeler
            </p>
          </div>
        </div>
      </div>

      {/* =============================
          COLUMN HEADERS
      ============================== */}

      <div
        className="
          hidden
          grid-cols-[minmax(240px,1fr)_190px_220px_130px_70px]
          items-center
          gap-5
          border-b
          border-gray-100
          bg-white/60
          px-6
          py-3

          dark:border-slate-800
          dark:bg-[#081321]

          lg:grid
        "
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
          Proje
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
          Project Manager
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
          Tarih
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
          Durum
        </span>

        <span />
      </div>

      {/* =============================
          PROJECT ROWS
      ============================== */}

      <div
        className="
          divide-y
          divide-gray-100

          dark:divide-slate-800
        "
      >
        {visibleProjects.map(
          (project) => {
            const statusText =
              getStatusText(
                project.status
              );

            const statusClass =
              getStatusClasses(
                project.status
              );

            return (
              <div
                key={
                  project.id
                }
                className="
                  grid
                  w-full
                  grid-cols-1
                  items-center
                  gap-4
                  px-6
                  py-4
                  transition

                  hover:bg-white/80

                  dark:bg-transparent
                  dark:hover:bg-white/[0.035]

                  lg:grid-cols-[minmax(240px,1fr)_190px_220px_130px_70px]
                  lg:gap-5
                "
              >
                {/* PROJECT */}

                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-[12px]
                      border
                      border-gray-100
                      bg-white
                      text-gray-600
                      shadow-sm

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-slate-300
                      dark:shadow-none
                    "
                  >
                    <BriefcaseBusiness
                      size={17}
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        truncate
                        text-[16px]
                        font-bold
                        tracking-[-0.015em]
                        text-gray-950

                        dark:text-slate-100
                      "
                    >
                      {
                        project.name
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[420px]
                        truncate
                        text-[12px]
                        font-medium
                        text-gray-500

                        dark:text-slate-500
                      "
                    >
                      {project.description ||
                        "Açıklama yok"}
                    </p>

                    {project.requiresMemberApproval && (
                      <div className="mt-2">
                        <span
                          className="
                            inline-flex
                            items-center
                            rounded-[7px]
                            border
                            border-red-300
                            bg-red-50
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            tracking-[-0.01em]
                            text-red-600

                            dark:border-red-400/40
                            dark:bg-red-400/10
                            dark:text-red-300
                          "
                        >
                          Project Manager onayı gerekli
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROJECT MANAGER */}

                <div className="flex items-center gap-2">
                  <UserRound
                    size={13}
                    className="
                      shrink-0
                      text-gray-400

                      dark:text-slate-500
                    "
                  />

                  <p
                    className="
                      truncate
                      text-[13px]
                      font-semibold
                      text-gray-700

                      dark:text-slate-300
                    "
                  >
                    {project.projectManagerName ||
                      "Atanmadı"}
                  </p>
                </div>

                {/* DATE */}

                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={13}
                    className="
                      shrink-0
                      text-gray-400

                      dark:text-slate-500
                    "
                  />

                  <p
                    className="
                      whitespace-nowrap
                      text-[12px]
                      font-semibold
                      text-gray-700

                      dark:text-slate-300
                    "
                  >
                    {formatDate(
                      project.startDate
                    )}

                    <span
                      className="
                        mx-2
                        text-gray-300

                        dark:text-slate-600
                      "
                    >
                      →
                    </span>

                    {formatDate(
                      project.endDate
                    )}
                  </p>
                </div>

                {/* STATUS */}

                <div>
                  <span
                    className={`
                      inline-flex
                      items-center
                      justify-center
                      rounded-[9px]
                      border
                      px-3.5
                      py-1.5
                      text-[11px]
                      font-bold
                      whitespace-nowrap

                      ${statusClass}
                    `}
                  >
                    {
                      statusText
                    }
                  </span>
                </div>

                {/* ONLY ARROW OPENS PROJECT */}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/projects/${project.id}`
                      )
                    }
                    aria-label={`${project.name} projesini aç`}
                    title="Projeyi aç"
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-[10px]
                      border
                      border-gray-200
                      bg-white
                      text-gray-500
                      transition

                      hover:border-gray-300
                      hover:bg-gray-50
                      hover:text-gray-950

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-slate-400

                      dark:hover:border-slate-500
                      dark:hover:bg-slate-800
                      dark:hover:text-white
                    "
                  >
                    <ArrowRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* =============================
          SHOW ALL / LESS
      ============================== */}

      {hasMore && (
        <div
          className="
            flex
            justify-center
            border-t
            border-gray-100
            bg-white/40
            px-5
            py-3.5

            dark:border-slate-800
            dark:bg-[#081321]
          "
        >
          <button
            type="button"
            onClick={() =>
              setExpanded(
                !expanded
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-[11px]
              border
              border-gray-200
              bg-white/80
              px-4
              py-2.5
              text-[10px]
              font-semibold
              text-gray-600
              transition

              hover:border-gray-300
              hover:bg-white
              hover:text-gray-900

              dark:border-slate-700
              dark:bg-slate-900/80
              dark:text-slate-300

              dark:hover:border-slate-600
              dark:hover:bg-slate-800
              dark:hover:text-white
            "
          >
            {expanded ? (
              <>
                Daha az göster

                <ChevronUp
                  size={14}
                />
              </>
            ) : (
              <>
                Tüm projeleri göster

                <span
                  className="
                    rounded-md
                    bg-gray-100
                    px-1.5
                    py-0.5
                    text-[9px]
                    text-gray-500

                    dark:bg-slate-800
                    dark:text-slate-400
                  "
                >
                  +
                  {
                    projects.length -
                    5
                  }
                </span>

                <ChevronDown
                  size={14}
                />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

export default function ProjectsPage() {
  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>([]);

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    role,
    setRole,
  ] =
    useState("");

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    departmentId,
    setDepartmentId,
  ] =
    useState("");

  const [
    projectManagerId,
    setProjectManagerId,
  ] =
    useState("");

  const [
    managers,
    setManagers,
  ] =
    useState<
      ProjectManagerOption[]
    >([]);

  const [
    loadingManagers,
    setLoadingManagers,
  ] =
    useState(false);

  const [
    startDate,
    setStartDate,
  ] =
    useState("");

  const [
    endDate,
    setEndDate,
  ] =
    useState("");

  const [
    requiresApproval,
    setRequiresApproval,
  ] =
    useState(false);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    createError,
    setCreateError,
  ] =
    useState("");

  const normalizedRole =
    normalizeRole(role);

  const isAdmin =
    normalizedRole ===
    "admin";

  const isProjectManager =
    normalizedRole ===
    "projectmanager";

  const canCreate =
    isAdmin ||
    isProjectManager;

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        projectResult,
        departmentResult,
      ] =
        await Promise.all([
          getProjects(),
          getDepartments(),
        ]);

      setProjects(
        projectResult
      );

      setDepartments(
        departmentResult
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Projeler yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current =
      getCurrentUser();

    setRole(
      current.role
    );

    setCurrentUserId(
      current.userId
    );

    loadData();
  }, []);

  const activeDepartments =
    useMemo(
      () =>
        departments.filter(
          (department) =>
            department.isActive !==
            false
        ),
      [departments]
    );

  useEffect(() => {
    async function loadManagers() {
      if (
        !departmentId
      ) {
        setManagers([]);
        setProjectManagerId("");

        return;
      }

      try {
        setLoadingManagers(
          true
        );

        setCreateError("");

        const result =
          await getProjectManagerOptions(
            departmentId
          );

        setManagers(
          result
        );

        if (
          isProjectManager
        ) {
          const current =
            result.find(
              (manager) =>
                manager.id.toLowerCase() ===
                currentUserId.toLowerCase()
            );

          setProjectManagerId(
            current?.id ||
              ""
          );
        } else {
          setProjectManagerId(
            result.length ===
              1
              ? result[0].id
              : ""
          );
        }
      } catch (err) {
        setManagers([]);
        setProjectManagerId("");

        setCreateError(
          err instanceof Error
            ? err.message
            : "Project Manager listesi alınamadı."
        );
      } finally {
        setLoadingManagers(
          false
        );
      }
    }

    loadManagers();
  }, [
    departmentId,
    isProjectManager,
    currentUserId,
  ]);

  const projectGroups =
    useMemo(
      () =>
        activeDepartments
          .map(
            (department) => ({
              department,

              projects:
                projects.filter(
                  (project) =>
                    project.departmentId
                      ?.toLowerCase() ===
                    department.id.toLowerCase()
                ),
            })
          )
          .filter(
            (group) =>
              group.projects.length >
              0
          ),
      [
        projects,
        activeDepartments,
      ]
    );

  function openModal() {
    setName("");
    setDescription("");
    setDepartmentId("");
    setProjectManagerId("");
    setManagers([]);
    setStartDate("");
    setEndDate("");
    setRequiresApproval(false);
    setCreateError("");
    setShowModal(true);
  }

  function closeModal() {
    if (
      creating
    ) {
      return;
    }

    setShowModal(false);
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      if (!name.trim()) {
        throw new Error(
          "Proje adı zorunludur."
        );
      }

      if (
        !departmentId
      ) {
        throw new Error(
          "Departman seçmelisiniz."
        );
      }

      if (
        managers.length ===
        0
      ) {
        throw new Error(
          "Bu departmanda aktif Project Manager bulunmuyor."
        );
      }

      if (
        !projectManagerId
      ) {
        throw new Error(
          "Projeye bir Project Manager atamalısınız."
        );
      }

      if (
        startDate &&
        endDate &&
        endDate <
          startDate
      ) {
        throw new Error(
          "Bitiş tarihi başlangıç tarihinden önce olamaz."
        );
      }

      await createProject({
        name:
          name.trim(),

        description:
          description.trim(),

        departmentId,

        projectManagerId,

        startDate:
          startDate ||
          null,

        endDate:
          endDate ||
          null,

        requiresMemberApproval:
          requiresApproval,
      });

      setShowModal(false);

      await loadData();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Proje oluşturulamadı."
      );
    } finally {
      setCreating(false);
    }
  }

  if (
    loading
  ) {
    return (
      <main className="min-h-screen px-7 py-8">
        <div className="mx-auto max-w-[1230px]">
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-gray-200
                  border-t-gray-900

                  dark:border-slate-700
                  dark:border-t-white
                "
              />

              <p className="mt-4 text-[12px] font-medium text-gray-500 dark:text-slate-400">
                Projeler yükleniyor...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-7 py-8">
      <div className="mx-auto max-w-[1230px]">

        {/* HEADER */}

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.24em]
                text-gray-400

                dark:text-slate-500
              "
            >
              Proje Yönetimi
            </p>

            <h1
              className="
                mt-2
                text-[34px]
                font-bold
                tracking-[-0.045em]
                text-gray-950

                dark:text-white
              "
            >
              Projeler
            </h1>

            <p
              className="
                mt-1.5
                text-[13px]
                text-gray-500

                dark:text-slate-400
              "
            >
              Projeleri departmanlara göre görüntüleyin ve yönetin.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={
                openModal
              }
              className="
                flex
                items-center
                gap-2
                rounded-[13px]
                bg-slate-950
                px-5
                py-3
                text-[13px]
                font-semibold
                text-white
                shadow-[0_8px_22px_rgba(15,23,42,0.15)]
                transition

                hover:-translate-y-0.5
                hover:bg-slate-800

                dark:border
                dark:border-blue-400/20
                dark:bg-[#0a1525]
                dark:shadow-[0_0_22px_rgba(59,130,246,0.08)]

                dark:hover:border-blue-400/40
                dark:hover:bg-[#0d1b2f]
              "
            >
              <Plus
                size={16}
              />

              Yeni Proje
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="
              mt-6
              rounded-[14px]
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-[12px]
              font-medium
              text-red-600

              dark:border-red-500/25
              dark:bg-red-500/10
              dark:text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* PROJECT GROUPS */}

        {projectGroups.length ===
        0 ? (
          <div
            className="
              mt-8
              rounded-[24px]
              border
              border-white/90
              bg-white/75
              px-6
              py-14
              text-center
              shadow-sm
              backdrop-blur-lg

              dark:border-slate-800
              dark:bg-[#081321]/90
            "
          >
            <BriefcaseBusiness
              size={30}
              className="mx-auto text-gray-300 dark:text-slate-600"
            />

            <p className="mt-4 text-[14px] font-bold text-gray-700 dark:text-slate-200">
              Henüz proje bulunmuyor
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {projectGroups.map(
              (
                {
                  department,
                  projects:
                    departmentProjects,
                },
                index
              ) => (
                <DepartmentProjectGroup
                  key={
                    department.id
                  }
                  department={
                    department
                  }
                  projects={
                    departmentProjects
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {/* =============================
          CREATE PROJECT MODAL
      ============================== */}

      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-900/10
            px-4
            backdrop-blur-[3px]

            dark:bg-black/55
          "
          onMouseDown={
            closeModal
          }
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-[500px]
              overflow-y-auto
              rounded-[24px]
              border
              border-white/90
              bg-white
              p-6
              shadow-2xl

              dark:border-slate-700
              dark:bg-[#081321]
              dark:text-white
            "
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                  Yeni Proje
                </p>

                <h2 className="mt-2 text-[21px] font-bold tracking-[-0.025em] text-gray-900 dark:text-white">
                  Proje oluştur
                </h2>

                <p className="mt-1.5 text-[10px] leading-4 text-gray-500 dark:text-slate-400">
                  Departmanı ve proje yöneticisini belirleyin.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  creating
                }
                onClick={
                  closeModal
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-400

                  hover:bg-gray-100

                  dark:text-slate-500
                  dark:hover:bg-slate-800
                  dark:hover:text-white
                "
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
                  Proje adı
                </label>

                <input
                  autoFocus
                  value={
                    name
                  }
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Örn. HewesoFlow"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-3
                    text-[12px]
                    outline-none

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                    dark:placeholder:text-slate-600
                  "
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
                  Departman
                </label>

                <select
                  value={
                    departmentId
                  }
                  onChange={(
                    event
                  ) =>
                    setDepartmentId(
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-3
                    text-[12px]

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                  "
                >
                  <option value="">
                    Departman seçin
                  </option>

                  {activeDepartments.map(
                    (department) => (
                      <option
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {departmentId && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
                    Project Manager
                  </label>

                  {loadingManagers ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-[10px] text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      Project Managerlar yükleniyor...
                    </div>
                  ) : managers.length ===
                    0 ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[10px] font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      Bu departmanda Project Manager bulunmuyor.
                    </div>
                  ) : (
                    <select
                      value={
                        projectManagerId
                      }
                      disabled={
                        isProjectManager
                      }
                      onChange={(
                        event
                      ) =>
                        setProjectManagerId(
                          event.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-3.5
                        py-3
                        text-[12px]

                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-white
                      "
                    >
                      <option value="">
                        Project Manager seçin
                      </option>

                      {managers.map(
                        (manager) => (
                          <option
                            key={
                              manager.id
                            }
                            value={
                              manager.id
                            }
                          >
                            {
                              manager.fullName
                            }
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
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
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Proje hakkında kısa açıklama..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-3
                    text-[12px]
                    outline-none

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                    dark:placeholder:text-slate-600
                  "
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
                    Başlangıç
                  </label>

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target.value;

                      setStartDate(
                        value
                      );

                      if (
                        endDate &&
                        endDate <
                          value
                      ) {
                        setEndDate("");
                      }
                    }}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-gray-700 dark:text-slate-300">
                    Bitiş
                  </label>

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    min={
                      startDate ||
                      undefined
                    }
                    disabled={
                      !startDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEndDate(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white

                      disabled:bg-gray-50
                      dark:disabled:bg-slate-900/50
                    "
                  />
                </div>
              </div>

              <label
                className="
                  flex
                  cursor-pointer
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50/70
                  p-3.5

                  dark:border-slate-700
                  dark:bg-slate-900/70
                "
              >
                <input
                  type="checkbox"
                  checked={
                    requiresApproval
                  }
                  onChange={(
                    event
                  ) =>
                    setRequiresApproval(
                      event.target.checked
                    )
                  }
                  className="mt-0.5"
                />

                <div>
                  <p className="text-[10px] font-bold text-gray-700 dark:text-slate-300">
                    Project Manager onayı gerekli
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-gray-400 dark:text-slate-500">
                    Proje tamamlanırken Project Manager onayı istenir.
                  </p>
                </div>
              </label>

              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[10px] font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {
                    createError
                  }
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-2.5
                    text-[10px]
                    font-bold
                    text-gray-600

                    dark:border-slate-700
                    dark:text-slate-300
                    dark:hover:bg-slate-800
                  "
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    !name.trim() ||
                    !departmentId ||
                    managers.length ===
                      0 ||
                    !projectManagerId
                  }
                  className="
                    rounded-xl
                    bg-black
                    px-4
                    py-2.5
                    text-[10px]
                    font-bold
                    text-white

                    dark:border
                    dark:border-blue-400/20
                    dark:bg-blue-500/15
                    dark:text-blue-200

                    disabled:opacity-40
                  "
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