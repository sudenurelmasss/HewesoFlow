"use client";

import { useEffect, useState } from "react";

import {
  AdminForbiddenError,
  AdminUser,
  getAdminUsers,
} from "@/services/adminService";

function getName(user: AdminUser) {
  if (user.fullName) {
    return user.fullName;
  }

  const name = `${user.firstName ?? ""} ${
    user.lastName ?? ""
  }`.trim();

  return name || user.email;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const result = await getAdminUsers();

      setUsers(result);
    } catch (error) {
      if (error instanceof AdminForbiddenError) {
        setForbidden(true);
        return;
      }

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Admin verileri yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const activeUsers = users.filter(
    (user) => user.isActive !== false
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">

      <div className="mx-auto max-w-7xl">

        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Yönetim Paneli
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Kullanıcı, rol, departman ve sistem yönetimi.
          </p>

        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Yönetim paneli yükleniyor...
            </p>

          </div>
        )}

        {!loading && forbidden && (
          <div className="rounded-[32px] border border-gray-200 bg-white p-14 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              🔐
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Yönetim paneline erişiminiz yok
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Bu bölüm yalnızca Admin rolüne sahip
              kullanıcılar tarafından kullanılabilir.
            </p>

            <a
              href="/"
              className="mt-7 inline-block rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Dashboard'a Dön
            </a>

          </div>
        )}

        {!loading &&
          !forbidden &&
          error && (
            <div className="rounded-3xl border border-red-200 bg-white p-8">

              <p className="font-medium text-red-600">
                Yönetim paneli yüklenemedi
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {error}
              </p>

              <button
                onClick={loadUsers}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm text-white"
              >
                Tekrar Dene
              </button>

            </div>
          )}

        {!loading &&
          !forbidden &&
          !error && (
            <>

              <div className="mb-6 grid gap-4 md:grid-cols-4">

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Toplam Kullanıcı
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {users.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Aktif
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {activeUsers}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Pasif
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {users.length - activeUsers}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-black p-6 text-white">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Sistem
                  </p>

                  <p className="mt-3 text-xl font-semibold">
                    Aktif
                  </p>
                </div>

              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">

                <a
                  href="/admin"
                  className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm text-gray-400">
                    Yönetim
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Kullanıcılar
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Sistem kullanıcılarını yönetin.
                  </p>
                </a>

                <a
                  href="/departments"
                  className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm text-gray-400">
                    Organizasyon
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Departmanlar
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Departman yapılarını görüntüleyin.
                  </p>
                </a>

                <a
                  href="/reports"
                  className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm text-gray-400">
                    Analiz
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Raporlar
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Sistem performansını inceleyin.
                  </p>
                </a>

              </div>

              <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white">

                <div className="border-b border-gray-100 p-6">

                  <h2 className="text-lg font-semibold">
                    Kullanıcılar
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Sistemde kayıtlı kullanıcılar.
                  </p>

                </div>

                {users.length === 0 ? (
                  <div className="p-14 text-center">

                    <p className="font-medium">
                      Kullanıcı bulunamadı
                    </p>

                  </div>
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">

                          <th className="px-6 py-4">
                            Kullanıcı
                          </th>

                          <th className="px-6 py-4">
                            Rol
                          </th>

                          <th className="px-6 py-4">
                            Departman
                          </th>

                          <th className="px-6 py-4">
                            Durum
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100 last:border-0"
                          >

                            <td className="px-6 py-5">

                              <p className="font-medium">
                                {getName(user)}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {user.email}
                              </p>

                            </td>

                            <td className="px-6 py-5 text-sm">
                              {user.role || "Belirtilmedi"}
                            </td>

                            <td className="px-6 py-5 text-sm">
                              {user.department ||
                                "Belirtilmedi"}
                            </td>

                            <td className="px-6 py-5">

                              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium">
                                {user.isActive === false
                                  ? "Pasif"
                                  : "Aktif"}
                              </span>

                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>

            </>
          )}

      </div>

    </main>
  );
}