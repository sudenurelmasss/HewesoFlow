"use client";

import {
  ReactNode,
  useMemo,
} from "react";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleCheckBig,
  ClipboardList,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import type {
  DashboardSummary,
} from "@/services/dashboardService";

import type {
  Department,
} from "@/services/departmentService";

import type {
  Project,
} from "@/services/projectService";

/* =========================================================
   TYPES
   ========================================================= */

type Props = {
  summary: DashboardSummary;
  departments: Department[];
  projects: Project[];
  displayName?: string;
};

type StatCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

/* =========================================================
   DEPARTMENT THEMES
   ========================================================= */

const departmentThemes = [
  {
    border:
      "border-indigo-300 dark:border-blue-400/35",

    badge:
      "bg-indigo-50 text-indigo-600 dark:bg-blue-400/10 dark:text-blue-300",
  },

  {
    border:
      "border-emerald-300 dark:border-emerald-400/35",

    badge:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
  },

  {
    border:
      "border-orange-300 dark:border-orange-400/35",

    badge:
      "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
  },
];

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div
      className="
        group
        min-h-[104px]
        rounded-[20px]
        border
        border-gray-200
        bg-white
        px-5
        py-4
        transition-all
        duration-200
        hover:-translate-y-[1px]
        hover:shadow-md

        dark:border-slate-800
        dark:bg-[#081321]
      "
    >
      <div className="flex h-full items-center justify-between gap-4">

        <div>
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.17em]
              text-gray-400

              dark:text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-[29px]
              font-bold
              leading-none
              tracking-[-0.04em]
              text-gray-900

              dark:text-white
            "
          >
            {value}
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-[13px]
            border
            border-gray-100
            bg-gray-50
            text-gray-700
            transition
            group-hover:bg-white

            dark:border-slate-700
            dark:bg-[#0d1a2b]
            dark:text-slate-200
          "
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   PROJECT STATUS
   ========================================================= */

function normalizeStatus(
  status?: string | number | null
) {
  if (
    typeof status === "number"
  ) {
    return status;
  }

  if (
    typeof status === "string"
  ) {
    const numeric =
      Number(status);

    if (
      !Number.isNaN(
        numeric
      )
    ) {
      return numeric;
    }

    return status
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  return "";
}

/* =========================================================
   COMPLETED PROJECT
   ========================================================= */

function isReallyCompleted(
  project: Project
) {
  const status =
    normalizeStatus(
      project.status
    );

  const completed =
    status === 4 ||
    status === "completed" ||
    status === "tamamlandi" ||
    status === "tamamlandı";

  if (!completed) {
    return false;
  }

  /*
   * Project Manager onayı
   * gerekmiyorsa Completed
   * yeterlidir.
   */
  if (
    !project.requiresMemberApproval
  ) {
    return true;
  }

  /*
   * PM onayı gerekiyorsa
   * onay verilmeden tamamlandı
   * kabul edilmez.
   */
  return Boolean(
    project.completionApprovedAt
  );
}

/* =========================================================
   CANCELLED
   ========================================================= */

function isCancelled(
  project: Project
) {
  const status =
    normalizeStatus(
      project.status
    );

  return (
    status === 5 ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "iptal"
  );
}

/* =========================================================
   DAYS UNTIL
   ========================================================= */

function getDaysUntil(
  dateValue?: string | null
) {
  if (!dateValue) {
    return null;
  }

  const end =
    new Date(
      dateValue
    );

  if (
    Number.isNaN(
      end.getTime()
    )
  ) {
    return null;
  }

  /*
   * Saat farklarının gün hesabını
   * bozmasını engellemek için
   * yalnızca tarihi karşılaştırıyoruz.
   */
  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const due =
    new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    );

  return Math.ceil(
    (
      due.getTime() -
      today.getTime()
    ) /
      86_400_000
  );
}

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

export default function AdminDashboard({
  summary,
  departments,
  projects,
  displayName,
}: Props) {

  /* =======================================================
     DELIVERY DATE
     ======================================================= */

  const approachingProjects =
    useMemo(
      () => {
        return projects

          /*
           * Yalnızca tamamlanmamış ve
           * iptal edilmemiş projeler.
           */
          .filter(
            (
              project
            ) => {
              if (
                isReallyCompleted(
                  project
                ) ||
                isCancelled(
                  project
                )
              ) {
                return false;
              }

              const days =
                getDaysUntil(
                  project.endDate
                );

              /*
               * 0 = bugün
               * 1 = yarın
               * 2 = 2 gün
               * 3 = 3 gün
               */
              return (
                days !== null &&
                days >= 0 &&
                days <= 3
              );
            }
          )

          /*
           * En yakın teslim
           * tarihi en üstte.
           */
          .sort(
            (
              first,
              second
            ) => {
              const firstDays =
                getDaysUntil(
                  first.endDate
                ) ?? 99;

              const secondDays =
                getDaysUntil(
                  second.endDate
                ) ?? 99;

              return (
                firstDays -
                secondDays
              );
            }
          );
      },
      [
        projects,
      ]
    );

  /* =======================================================
     DEPARTMENT ACTIVE PROJECT COUNTS
     ======================================================= */

  const departmentRows =
    useMemo(
      () => {
        return departments

          .map(
            (
              department
            ) => {
              const activeProjectCount =
                projects.filter(
                  (
                    project
                  ) => {
                    const sameDepartment =
                      String(
                        project.departmentId
                      ).toLowerCase() ===
                      String(
                        department.id
                      ).toLowerCase();

                    return (
                      sameDepartment &&
                      !isReallyCompleted(
                        project
                      ) &&
                      !isCancelled(
                        project
                      )
                    );
                  }
                ).length;

              return {
                ...department,

                activeProjectCount,
              };
            }
          )

          /*
           * En çok aktif projesi
           * olan departman üstte.
           */
          .sort(
            (
              first,
              second
            ) =>
              second.activeProjectCount -
              first.activeProjectCount
          );
      },
      [
        departments,
        projects,
      ]
    );

  const hasApproachingProjects =
    approachingProjects.length >
    0;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        px-6
        py-8
        text-[#15161a]

        dark:text-white
      "
    >
      <div className="mx-auto max-w-[1180px]">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-6">

          <h1
            className="
              text-[31px]
              font-bold
              tracking-[-0.045em]
              text-gray-900

              dark:text-white
            "
          >
            Yönetim Paneli
          </h1>

          <p
            className="
              mt-1.5
              text-[13px]
              font-medium
              text-gray-500

              dark:text-slate-400
            "
          >
            {displayName
              ? `Hoş geldiniz, ${displayName}. Projelerin genel durumunu takip edin.`
              : "Projelerin genel durumunu takip edin."}
          </p>

        </div>

        {/* =================================================
            TOP STAT CARDS
            ================================================= */}

        <div
          className="
            grid
            gap-3
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            label="Toplam Proje"
            value={
              summary.totalProjects
            }
            icon={
              <FolderKanban
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Toplam Görev"
            value={
              summary.totalTasks
            }
            icon={
              <ClipboardList
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Devam Eden"
            value={
              summary.activeProjects
            }
            icon={
              <ListTodo
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Tamamlanan"
            value={
              summary.completedProjects
            }
            icon={
              <CheckCircle2
                size={18}
                strokeWidth={1.9}
              />
            }
          />
        </div>

        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <div
          className="
            mt-4
            grid
            gap-4
            lg:grid-cols-2
          "
        >

          {/* =================================================
              DELIVERY DATE
              ================================================= */}

          <section
            className={`
              min-h-[310px]
              rounded-[22px]
              border-2
              bg-white
              p-5
              shadow-sm
              transition-colors

              dark:bg-[#081321]

              ${
                hasApproachingProjects
                  ? `
                      border-red-300
                      dark:border-red-500/45
                    `
                  : `
                      border-emerald-300
                      dark:border-emerald-500/45
                    `
              }
            `}
          >

            {/* HEADER */}

            <div
              className={`
                flex
                items-start
                justify-between
                gap-4
                border-b
                pb-4

                ${
                  hasApproachingProjects
                    ? `
                        border-red-100
                        dark:border-red-500/20
                      `
                    : `
                        border-emerald-100
                        dark:border-emerald-500/20
                      `
                }
              `}
            >

              <div className="flex items-start gap-3">

                <div
                  className={`
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl

                    ${
                      hasApproachingProjects
                        ? `
                            bg-red-50
                            text-red-600

                            dark:bg-red-500/10
                            dark:text-red-300
                          `
                        : `
                            bg-emerald-50
                            text-emerald-600

                            dark:bg-emerald-500/10
                            dark:text-emerald-300
                          `
                    }
                  `}
                >
                  {hasApproachingProjects ? (
                    <AlertTriangle
                      size={17}
                      strokeWidth={2.1}
                    />
                  ) : (
                    <CircleCheckBig
                      size={17}
                      strokeWidth={2.1}
                    />
                  )}
                </div>

                <div>

                  <h2
                    className="
                      text-[15px]
                      font-bold
                      tracking-tight
                      text-gray-900

                      dark:text-white
                    "
                  >
                    Teslim Tarihi Yaklaşan Projeler
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      font-medium
                      text-gray-500

                      dark:text-slate-400
                    "
                  >
                    {hasApproachingProjects
                      ? "Teslim tarihine 3 gün veya daha az kalan tamamlanmamış projeler."
                      : "Teslim tarihi yaklaşan proje bulunmuyor."}
                  </p>

                </div>
              </div>

              <div
                className={`
                  flex
                  h-7
                  min-w-7
                  items-center
                  justify-center
                  rounded-lg
                  px-2
                  text-[11px]
                  font-bold

                  ${
                    hasApproachingProjects
                      ? `
                          bg-red-50
                          text-red-600

                          dark:bg-red-500/10
                          dark:text-red-300
                        `
                      : `
                          bg-emerald-50
                          text-emerald-600

                          dark:bg-emerald-500/10
                          dark:text-emerald-300
                        `
                  }
                `}
              >
                {
                  approachingProjects.length
                }
              </div>

            </div>

            {/* =================================================
                PROJECT LIST
                ================================================= */}

            {hasApproachingProjects ? (
              <div className="mt-2">

                {approachingProjects
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      project
                    ) => {

                      const days =
                        getDaysUntil(
                          project.endDate
                        ) ?? 0;

                      return (
                        <div
                          key={
                            project.id
                          }
                          className="
                            grid
                            min-h-[58px]
                            grid-cols-[minmax(0,1fr)_minmax(90px,0.65fr)_80px]
                            items-center
                            gap-3
                            border-b
                            border-gray-100
                            py-3
                            last:border-b-0

                            dark:border-slate-800
                          "
                        >

                          {/* PROJECT */}

                          <div className="min-w-0">

                            <p
                              className="
                                truncate
                                text-[12px]
                                font-bold
                                text-gray-900

                                dark:text-white
                              "
                            >
                              {
                                project.name
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                truncate
                                text-[10px]
                                font-medium
                                text-gray-400

                                dark:text-slate-500
                              "
                            >
                              {project.departmentName ||
                                "Departman yok"}
                            </p>

                          </div>

                          {/* PM */}

                          <p
                            className="
                              truncate
                              text-[11px]
                              font-medium
                              text-gray-600

                              dark:text-slate-300
                            "
                          >
                            {project.projectManagerName ||
                              "Project Manager yok"}
                          </p>

                          {/* DAYS */}

                          <div className="flex justify-end">

                            <span
                              className="
                                rounded-lg
                                bg-red-50
                                px-2
                                py-1.5
                                text-[10px]
                                font-bold
                                text-red-600

                                dark:bg-red-500/10
                                dark:text-red-300
                              "
                            >
                              {days === 0
                                ? "Bugün"
                                : `${days} gün`}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

              </div>
            ) : (

              /* =================================================
                 NO PROJECT
                 ================================================= */

              <div
                className="
                  flex
                  min-h-[220px]
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-emerald-50
                    text-emerald-600

                    dark:bg-emerald-500/10
                    dark:text-emerald-300
                  "
                >
                  <CircleCheckBig
                    size={20}
                  />
                </div>

                <p
                  className="
                    mt-3
                    text-[13px]
                    font-bold
                    text-gray-900

                    dark:text-white
                  "
                >
                  Teslim tarihi yaklaşan proje yok
                </p>

                <p
                  className="
                    mt-1
                    max-w-[280px]
                    text-[11px]
                    leading-5
                    text-gray-500

                    dark:text-slate-400
                  "
                >
                  Önümüzdeki 3 gün içinde teslim edilmesi gereken tamamlanmamış bir proje bulunmuyor.
                </p>

              </div>
            )}

          </section>

          {/* =================================================
              DEPARTMENTS
              ================================================= */}

          <section
            className="
              min-h-[310px]
              rounded-[22px]
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
                border-b
                border-gray-100
                pb-4

                dark:border-slate-800
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gray-50
                  text-gray-700

                  dark:bg-[#0d1a2b]
                  dark:text-slate-200
                "
              >
                <Building2
                  size={17}
                  strokeWidth={1.9}
                />
              </div>

              <div>

                <h2
                  className="
                    text-[15px]
                    font-bold
                    tracking-tight
                    text-gray-900

                    dark:text-white
                  "
                >
                  Departmanlar
                </h2>

                <p
                  className="
                    mt-1
                    text-[11px]
                    font-medium
                    text-gray-500

                    dark:text-slate-400
                  "
                >
                  Departmanların aktif proje sayıları.
                </p>

              </div>

            </div>

            {/* =================================================
                DEPARTMENT LIST
                ================================================= */}

            {departmentRows.length >
            0 ? (

              <div className="mt-3 grid gap-2.5">

                {departmentRows.map(
                  (
                    department,
                    index
                  ) => {

                    const theme =
                      departmentThemes[
                        index %
                        departmentThemes.length
                      ];

                    return (
                      <div
                        key={
                          department.id
                        }
                        className={`
                          flex
                          min-h-[62px]
                          items-center
                          justify-between
                          gap-4
                          rounded-[16px]
                          border-[1.5px]
                          bg-white
                          px-4
                          py-3

                          dark:bg-[#081321]

                          ${theme.border}
                        `}
                      >

                        <p
                          className="
                            min-w-0
                            truncate
                            text-[12px]
                            font-bold
                            text-gray-900

                            dark:text-white
                          "
                        >
                          {
                            department.name
                          }
                        </p>

                        <div
                          className={`
                            rounded-xl
                            px-3
                            py-2

                            ${theme.badge}
                          `}
                        >

                          <span className="text-[12px] font-bold">
                            {
                              department.activeProjectCount
                            }
                          </span>

                          <span className="ml-1 text-[9px] font-semibold opacity-70">
                            aktif proje
                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            ) : (

              <div
                className="
                  flex
                  min-h-[220px]
                  items-center
                  justify-center
                  text-center
                "
              >
                <p
                  className="
                    text-[12px]
                    font-medium
                    text-gray-500

                    dark:text-slate-400
                  "
                >
                  Henüz departman bulunmuyor.
                </p>
              </div>

            )}

          </section>

        </div>

      </div>
    </main>
  );
}