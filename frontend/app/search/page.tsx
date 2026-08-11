"use client";

import { useMemo, useState } from "react";

import {
  getProjects,
  Project,
} from "@/services/projectService";

import {
  getMyTasks,
  TaskItem,
} from "@/services/taskService";

export default function SearchPage() {
  const [search, setSearch] =
    useState("");

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<TaskItem[]>([]);

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSearch() {
    if (!search.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        projectResult,
        taskResult,
      ] = await Promise.all([
        getProjects(),
        getMyTasks(),
      ]);

      setProjects(projectResult);
      setTasks(taskResult);

      setSearched(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects =
    useMemo(() => {
      const value =
        search.toLowerCase();

      return projects.filter(
        (project) =>
          `${project.name} ${
            project.description ?? ""
          }`
            .toLowerCase()
            .includes(value)
      );
    }, [projects, search]);

  const filteredTasks =
    useMemo(() => {
      const value =
        search.toLowerCase();

      return tasks.filter(
        (task) =>
          `${task.title} ${
            task.description ?? ""
          } ${
            task.projectName ?? ""
          }`
            .toLowerCase()
            .includes(value)
      );
    }, [tasks, search]);

  const totalResults =
    filteredProjects.length +
    filteredTasks.length;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">

      <div className="mx-auto max-w-6xl">

        <div className="mb-8">

          <p className="text-sm text-gray-500">
            HewesoFlow
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Arama
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Proje ve görevleriniz arasında arama yapın.
          </p>

        </div>

        <div className="flex gap-3 rounded-3xl border border-gray-200 bg-white p-4">

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                handleSearch();
              }
            }}
            placeholder="Proje veya görev ara..."
            className="flex-1 rounded-2xl bg-gray-50 px-5 py-3 text-sm outline-none"
          />

          <button
            onClick={
              handleSearch
            }
            disabled={loading}
            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading
              ? "Aranıyor..."
              : "Ara"}
          </button>

        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-white p-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {searched &&
          !error && (
            <div className="mt-8">

              <p className="mb-5 text-sm text-gray-500">
                {totalResults} sonuç bulundu
              </p>

              <div className="grid gap-6 lg:grid-cols-2">

                <section className="rounded-3xl border border-gray-200 bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Projeler
                  </h2>

                  <div className="mt-5 space-y-3">

                    {filteredProjects.length ===
                    0 ? (
                      <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                        Proje bulunamadı.
                      </p>
                    ) : (
                      filteredProjects.map(
                        (project) => (
                          <a
                            key={
                              project.id
                            }
                            href={`/projects/${project.id}`}
                            className="block rounded-2xl border border-gray-100 p-4 hover:bg-gray-50"
                          >
                            <p className="font-medium">
                              {
                                project.name
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {project.description ||
                                "Açıklama yok"}
                            </p>
                          </a>
                        )
                      )
                    )}

                  </div>

                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6">

                  <h2 className="text-lg font-semibold">
                    Görevler
                  </h2>

                  <div className="mt-5 space-y-3">

                    {filteredTasks.length ===
                    0 ? (
                      <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                        Görev bulunamadı.
                      </p>
                    ) : (
                      filteredTasks.map(
                        (task) => (
                          <a
                            key={
                              task.id
                            }
                            href={`/my-tasks/${task.id}`}
                            className="block rounded-2xl border border-gray-100 p-4 hover:bg-gray-50"
                          >
                            <p className="font-medium">
                              {
                                task.title
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {task.projectName ||
                                "Proje belirtilmedi"}
                            </p>
                          </a>
                        )
                      )
                    )}

                  </div>

                </section>

              </div>

            </div>
          )}

      </div>

    </main>
  );
}