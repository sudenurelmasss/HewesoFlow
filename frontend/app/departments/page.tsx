"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Department,
  DepartmentForbiddenError,
  getDepartments,
} from "@/services/departmentService";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const result = await getDepartments();

      setDepartments(result);
    } catch (error) {
      if (error instanceof DepartmentForbiddenError) {
        setForbidden(true);
        return;
      }

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Departmanlar yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return departments;
    }

    return departments.filter((department) =>
      `${department.name} ${department.description ?? ""}`
        .toLowerCase()
        .includes(value)
    );
  }, [departments, search]);

  const activeCount = departments.filter(
    (department) => department.isActive !== false
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Departmanlar
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Organizasyon yapısındaki departmanları görüntüleyin.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Departmanlar yükleniyor...
            </p>
          </div>
        )}

        {!loading && forbidden && (
          <div className="rounded-[32px] border border-gray-200 bg-white p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              🔒
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Bu alan için yetkiniz bulunmuyor
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Departman yönetimi yalnızca yetkili kullanıcılar
              tarafından görüntülenebilir.
            </p>

            <a
              href="/"
              className="mt-7 inline-block rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Dashboard&apos;a Dön
            </a>
          </div>
        )}

        {!loading && !forbidden && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">
            <p className="font-medium text-red-600">
              Departmanlar yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadDepartments}
              className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm text-white"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !forbidden && !error && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Toplam Departman
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {departments.length}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Aktif
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Pasif
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {departments.length - activeCount}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Departman ara..."
                className="w-full rounded-2xl bg-gray-50 px-5 py-3 text-sm outline-none"
              />
            </div>

            {departments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  ◫
                </div>

                <h2 className="text-lg font-semibold">
                  Henüz departman bulunmuyor
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Veritabanında görüntülenebilecek departman bulunamadı.
                </p>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">
                <p className="font-medium">
                  Sonuç bulunamadı
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredDepartments.map((department) => (
                  <article
                    key={department.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black font-semibold text-white">
                        {department.name.charAt(0).toUpperCase()}
                      </div>

                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium">
                        {department.isActive === false
                          ? "Pasif"
                          : "Aktif"}
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg font-semibold">
                      {department.name}
                    </h2>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
                      {department.description ||
                        "Bu departman için açıklama bulunmuyor."}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}