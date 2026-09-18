"use client";

import { ReactNode } from "react";

import {
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import {
  DashboardSummary,
} from "@/services/dashboardService";

type Props = {
  summary: DashboardSummary;
  displayName: string;
};

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

export default function ProjectManagerDashboard({
  summary,
  displayName,
}: Props) {
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
              ? `Hoş geldiniz, ${displayName}. Yönettiğiniz proje ve görevlerin durumunu takip edin.`
              : "Yönettiğiniz proje ve görevlerin durumunu takip edin."}
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
            label="Yönettiğim Projeler"
            value={summary.totalProjects}
            icon={
              <FolderKanban
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Toplam Görev"
            value={summary.totalTasks}
            icon={
              <ClipboardList
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Devam Eden Görev"
            value={summary.inProgressTasks}
            icon={
              <ListTodo
                size={18}
                strokeWidth={1.9}
              />
            }
          />

          <StatCard
            label="Tamamlanan Görev"
            value={summary.completedTasks}
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