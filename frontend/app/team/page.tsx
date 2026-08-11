"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ForbiddenError,
  getTeamMembers,
  TeamMember,
} from "@/services/teamService";

function getDisplayName(member: TeamMember) {
  if (member.fullName) {
    return member.fullName;
  }

  const fullName = `${member.firstName ?? ""} ${
    member.lastName ?? ""
  }`.trim();

  if (fullName) {
    return fullName;
  }

  return member.email || "İsimsiz Kullanıcı";
}

function getInitial(member: TeamMember) {
  return getDisplayName(member).charAt(0).toUpperCase();
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [search, setSearch] = useState("");

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const result = await getTeamMembers();

      setMembers(result);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        setForbidden(true);
        return;
      }

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ekip bilgileri yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return members;
    }

    return members.filter((member) => {
      const text = `
        ${getDisplayName(member)}
        ${member.email ?? ""}
        ${member.role ?? ""}
        ${member.department ?? ""}
        ${member.projectName ?? ""}
      `.toLowerCase();

      return text.includes(value);
    });
  }, [members, search]);

  const activeMembers = members.filter(
    (member) => member.isActive !== false
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Ekip
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Kullanıcıları ve proje ekiplerini görüntüleyin.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Ekip bilgileri yükleniyor...
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
              Ekip ve kullanıcı yönetimi yalnızca yetkili
              kullanıcılar tarafından görüntülenebilir.
              TeamMember hesabınızla kendi projelerinizi ve
              görevlerinizi kullanmaya devam edebilirsiniz.
            </p>

            <div className="mt-7 flex justify-center gap-3">

              <a
                href="/projects"
                className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-medium"
              >
                Projelere Git
              </a>

              <a
                href="/my-tasks"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Görevlerime Git
              </a>

            </div>
          </div>
        )}

        {!loading && !forbidden && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">

            <p className="font-medium text-red-600">
              Ekip yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadMembers}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm text-white"
            >
              Tekrar Dene
            </button>

          </div>
        )}

        {!loading &&
          !forbidden &&
          !error && (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-3">

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Toplam Üye
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {members.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Aktif
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {activeMembers}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Pasif
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {members.length - activeMembers}
                  </p>
                </div>

              </div>

              <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4">

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="İsim, e-posta, rol veya departman ara..."
                  className="w-full rounded-2xl bg-gray-50 px-5 py-3 text-sm outline-none"
                />

              </div>

              {members.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">

                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    👥
                  </div>

                  <h2 className="text-lg font-semibold">
                    Henüz ekip üyesi bulunmuyor
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Görüntülenebilecek ekip bilgisi bulunamadı.
                  </p>

                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {filteredMembers.map((member, index) => (
                    <article
                      key={
                        member.id ||
                        member.userId ||
                        index
                      }
                      className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      <div className="flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-semibold text-white">
                          {getInitial(member)}
                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium">
                          {member.isActive === false
                            ? "Pasif"
                            : "Aktif"}
                        </span>

                      </div>

                      <h2 className="mt-5 text-lg font-semibold">
                        {getDisplayName(member)}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {member.email || "E-posta yok"}
                      </p>

                      <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">

                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-400">
                            Rol
                          </span>

                          <span className="text-sm font-medium">
                            {member.role || "Belirtilmedi"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-400">
                            Departman
                          </span>

                          <span className="text-sm font-medium">
                            {member.department || "Belirtilmedi"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-400">
                            Proje
                          </span>

                          <span className="text-sm font-medium">
                            {member.projectName || "Belirtilmedi"}
                          </span>
                        </div>

                      </div>

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