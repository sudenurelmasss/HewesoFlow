"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import AdminDashboard
  from "@/components/dashboard/AdminDashboard";

import ProjectManagerDashboard
  from "@/components/dashboard/ProjectManagerDashboard";

import {
  useCurrentUser,
} from "@/hooks/useCurrentUser";

import {
  DashboardSummary,
  getDashboardSummary,
} from "@/services/dashboardService";

import {
  Department,
  getDepartments,
} from "@/services/departmentService";

import {
  getProjects,
  Project,
} from "@/services/projectService";

/* =========================================================
   EMPTY SUMMARY
   ========================================================= */

const emptySummary: DashboardSummary = {
  totalProjects: 0,

  activeProjects: 0,

  completedProjects: 0,

  totalTasks: 0,

  todoTasks: 0,

  inProgressTasks: 0,

  inReviewTasks: 0,

  completedTasks: 0,

  overdueTasks: 0,

  assignedToMeTasks: 0,

  completionPercentage: 0,
};

/* =========================================================
   TEAM MEMBER CARD
   ========================================================= */

type StatCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div
      className="
        min-h-[104px]
        rounded-[20px]
        border
        border-gray-200
        bg-white
        px-5
        py-4
        shadow-sm

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
            items-center
            justify-center
            rounded-[13px]
            border
            border-gray-100
            bg-gray-50
            text-gray-700

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
   PAGE
   ========================================================= */

export default function DashboardPage() {
  const {
    user,

    loading:
      userLoading,

    isAdmin,

    isProjectManager,
  } =
    useCurrentUser();

  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary>(
      emptySummary
    );

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>(
      []
    );

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOAD
     ======================================================= */

  async function loadDashboard() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      /*
       * Dashboard sayıları.
       */
      const dashboardResult =
        await getDashboardSummary();

      setSummary(
        dashboardResult
      );

      /*
       * Departman + proje listesi
       * yalnızca Admin dashboard
       * için gerekli.
       */
      if (isAdmin) {
        const [
          departmentResult,
          projectResult,
        ] =
          await Promise.all([
            getDepartments(),
            getProjects(),
          ]);

        setDepartments(
          departmentResult
        );

        setProjects(
          projectResult
        );
      }
    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Dashboard yüklenemedi."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =======================================================
     EFFECT
     ======================================================= */

  useEffect(
    () => {
      if (
        !userLoading
      ) {
        loadDashboard();
      }
    },
    [
      userLoading,
      isAdmin,
    ]
  );

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading ||
    userLoading
  ) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-[1180px]">
          <div
            className="
              rounded-[22px]
              border
              border-gray-200
              bg-white
              p-14
              text-center

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >
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
                dark:border-t-blue-400
              "
            />

            <p
              className="
                mt-4
                text-sm
                font-medium
                text-gray-500

                dark:text-slate-400
              "
            >
              Dashboard yükleniyor...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-[1180px]">
          <div
            className="
              rounded-[22px]
              border
              border-red-200
              bg-white
              p-8

              dark:border-red-500/30
              dark:bg-[#081321]
            "
          >
            <p
              className="
                font-bold
                text-red-600

                dark:text-red-300
              "
            >
              Dashboard yüklenemedi
            </p>

            <p
              className="
                mt-2
                text-sm
                text-gray-500

                dark:text-slate-400
              "
            >
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadDashboard
              }
              className="
                mt-5
                rounded-xl
                bg-black
                px-5
                py-3
                text-sm
                font-semibold
                text-white

                dark:bg-white
                dark:text-black
              "
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     USER NAME
     ======================================================= */

  const displayName =
    `${
      user?.firstName ??
      ""
    } ${
      user?.lastName ??
      ""
    }`.trim();

  /* =======================================================
     ADMIN
     ======================================================= */

  if (
    isAdmin
  ) {
    return (
      <AdminDashboard
        summary={
          summary
        }
        departments={
          departments
        }
        projects={
          projects
        }
        displayName={
          displayName
        }
      />
    );
  }

  /* =======================================================
     PROJECT MANAGER
     ======================================================= */

  if (
    isProjectManager
  ) {
    return (
      <ProjectManagerDashboard
        summary={
          summary
        }
        displayName={
          displayName
        }
      />
    );
  }

  /* =======================================================
     TEAM MEMBER
     ======================================================= */

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1180px]">
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
            Dashboard
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
              ? `Hoş geldiniz, ${displayName}. Proje ve görev durumunuzu takip edin.`
              : "Proje ve görev durumunuzu takip edin."}
          </p>
        </div>

        <div
          className="
            grid
            gap-3
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            label="Projelerim"
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
            label="Görevler"
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
            label="Devam Eden Görev"
            value={
              summary.inProgressTasks
            }
            icon={
              <ListTodo
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Tamamlanan Görev"
            value={
              summary.completedTasks
            }
            icon={
              <CheckCircle2
                size={18}
                strokeWidth={1.9}
              />
            }
          />
        </div>
      </div>
    </main>
  );
}