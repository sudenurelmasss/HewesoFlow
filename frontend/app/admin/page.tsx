"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  AdminForbiddenError,
  AdminUser,
  SystemRole,
  assignUserRole,
  changeUserStatus,
  getAdminUsers,
  getSystemRoles,
  removeUserRole,
} from "@/services/adminService";

/* =========================================================
   HELPERS
   ========================================================= */

function getUserName(user: AdminUser) {
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email
  );
}

function normalizeRole(role?: string | null) {
  return (
    role
      ?.replace(/\s+/g, "")
      .toLocaleLowerCase("tr-TR") ?? ""
  );
}

function getRoleLabel(roleName: string) {
  const normalized = normalizeRole(roleName);

  if (normalized === "projectmanager") {
    return "Project Manager";
  }

  if (normalized === "teammember") {
    return "Team Member";
  }

  return roleName;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  /* =======================================================
     LOAD
     ======================================================= */

  async function load() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const [userResult, roleResult] = await Promise.all([
        getAdminUsers(),
        getSystemRoles(),
      ]);

      setUsers(userResult);

      /*
       * Admin rolü bu panelden atanamaz / kaldırılamaz.
       */
      setRoles(
        roleResult.filter(
          (role) => normalizeRole(role.name) !== "admin"
        )
      );
    } catch (error) {
      if (error instanceof AdminForbiddenError) {
        setForbidden(true);
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Veriler alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =======================================================
     ROLE CHANGE
     ======================================================= */

  async function roleChange(
    user: AdminUser,
    role: SystemRole,
    checked: boolean
  ) {
    if (normalizeRole(role.name) === "admin") {
      return;
    }

    const busyId = `${user.id}-${role.id}`;

    try {
      setBusy(busyId);
      setError("");

      if (checked) {
        await assignUserRole(user.id, role.id);
      } else {
        await removeUserRole(user.id, role.id);
      }

      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Rol değiştirilemedi."
      );
    } finally {
      setBusy("");
    }
  }

  /* =======================================================
     STATUS
     ======================================================= */

  async function statusChange(
    user: AdminUser,
    nextStatus: boolean
  ) {
    const isSystemAdmin = (user.roles || []).some(
      (role) => normalizeRole(role) === "admin"
    );

    /*
     * Sistem Admini aktif / pasif yapılamaz.
     */
    if (isSystemAdmin) {
      return;
    }

    if (user.isActive === nextStatus) {
      return;
    }

    try {
      setBusy(user.id);
      setError("");

      await changeUserStatus(user.id, nextStatus);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: nextStatus,
              }
            : item
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kullanıcı durumu değiştirilemedi."
      );

      await load();
    } finally {
      setBusy("");
    }
  }

  /* =======================================================
     COUNTS
     ======================================================= */

  const activeUsers = users.filter((user) => user.isActive).length;
  const passiveUsers = users.length - activeUsers;

  /* =======================================================
     ROLES
     ======================================================= */

  const visibleRoles = useMemo(
    () =>
      [...roles].sort((first, second) => {
        const firstName = normalizeRole(first.name);
        const secondName = normalizeRole(second.name);

        if (firstName === "projectmanager") {
          return -1;
        }

        if (secondName === "projectmanager") {
          return 1;
        }

        return first.name.localeCompare(second.name, "tr");
      }),
    [roles]
  );

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen px-7 py-8">
        <div
          className="
            mx-auto
            max-w-[1380px]
            rounded-[24px]
            border
            border-white/80
            bg-white/90
            p-14
            text-center
            shadow-sm
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081321]
          "
        >
          <div
            className="
              mx-auto
              mb-4
              h-9
              w-9
              animate-spin
              rounded-full
              border-[3px]
              border-gray-200
              border-t-black

              dark:border-slate-700
              dark:border-t-white
            "
          />

          <p
            className="
              text-[12px]
              font-medium
              text-gray-500

              dark:text-slate-400
            "
          >
            Yönetim paneli yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     FORBIDDEN
     ========================================================= */

  if (forbidden) {
    return (
      <main className="min-h-screen px-7 py-8">
        <div
          className="
            mx-auto
            max-w-3xl
            rounded-[24px]
            border
            border-white/80
            bg-white/90
            p-12
            text-center
            shadow-sm
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081321]
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gray-100
              text-gray-500

              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            <ShieldCheck size={25} />
          </div>

          <h1 className="mt-5 text-[20px] font-bold">
            Bu alan yalnızca Admin içindir.
          </h1>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        px-7
        py-8
        pb-28
        text-gray-950

        dark:text-white
      "
    >
      <div className="mx-auto max-w-[1380px]">

        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="mb-7">
          <p
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.22em]
              text-gray-400

              dark:text-slate-500
            "
          >
            Sistem Yönetimi
          </p>

          <h1
            className="
              mt-2
              text-[28px]
              font-bold
              tracking-[-0.035em]
              text-gray-950

              dark:text-white
            "
          >
            Kullanıcı ve Yetki Yönetimi
          </h1>

          <p
            className="
              mt-1.5
              text-[12px]
              font-medium
              text-gray-500

              dark:text-slate-400
            "
          >
            Kullanıcıların rollerini ve hesap durumlarını yönetin.
          </p>
        </div>

        {/* ===================================================
            STATS
            =================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          {/* TOTAL */}

          <div
            className="
              flex
              min-h-[92px]
              items-center
              gap-4
              rounded-[18px]
              border
              border-white/80
              bg-white/92
              px-5
              py-4
              shadow-[0_7px_24px_rgba(15,23,42,0.045)]
              backdrop-blur-xl

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[12px]
                bg-slate-100
                text-slate-500

                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              <UsersRound size={19} />
            </div>

            <div>
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-gray-400
                "
              >
                Toplam Kullanıcı
              </p>

              <p
                className="
                  mt-0.5
                  text-[24px]
                  font-bold
                  tracking-[-0.03em]
                "
              >
                {users.length}
              </p>
            </div>
          </div>

          {/* ACTIVE */}

          <div
            className="
              flex
              min-h-[92px]
              items-center
              gap-4
              rounded-[18px]
              border
              border-white/80
              bg-white/92
              px-5
              py-4
              shadow-[0_7px_24px_rgba(15,23,42,0.045)]
              backdrop-blur-xl

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[12px]
                bg-slate-100
                text-slate-500

                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              <UserRound size={19} />
            </div>

            <div>
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-gray-400
                "
              >
                Aktif Kullanıcı
              </p>

              <p
                className="
                  mt-0.5
                  text-[24px]
                  font-bold
                  tracking-[-0.03em]
                "
              >
                {activeUsers}
              </p>
            </div>
          </div>

          {/* PASSIVE */}

          <div
            className="
              flex
              min-h-[92px]
              items-center
              gap-4
              rounded-[18px]
              border
              border-white/80
              bg-white/92
              px-5
              py-4
              shadow-[0_7px_24px_rgba(15,23,42,0.045)]
              backdrop-blur-xl

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[12px]
                bg-slate-100
                text-slate-500

                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              <UserRound size={19} />
            </div>

            <div>
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-gray-400
                "
              >
                Pasif Kullanıcı
              </p>

              <p
                className="
                  mt-0.5
                  text-[24px]
                  font-bold
                  tracking-[-0.03em]
                "
              >
                {passiveUsers}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div
            className="
              mb-5
              rounded-[14px]
              border
              border-red-200
              bg-red-50
              px-5
              py-3.5
              text-[11px]
              font-semibold
              text-red-600

              dark:border-red-500/30
              dark:bg-red-500/10
              dark:text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* ===================================================
            TABLE
            =================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[24px]
            border
            border-white/80
            bg-white/92
            shadow-[0_9px_30px_rgba(15,23,42,0.055)]
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081321]/95
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">

              {/* HEADER */}

              <thead>
                <tr
                  className="
                    border-b
                    border-gray-100
                    bg-gray-50/75
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-gray-500

                    dark:border-slate-800
                    dark:bg-slate-900/70
                    dark:text-slate-400
                  "
                >
                  <th className="px-6 py-4">
                    Kullanıcı
                  </th>

                  <th className="px-6 py-4">
                    Yetkiler
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
                {users.map((user) => {
                  const isSystemAdmin = (user.roles || []).some(
                    (role) => normalizeRole(role) === "admin"
                  );

                  return (
                    <tr
                      key={user.id}
                      className="
                        border-b
                        border-gray-100
                        transition

                        last:border-0
                        hover:bg-gray-50/45

                        dark:border-slate-800
                        dark:hover:bg-slate-900/30
                      "
                    >

                      {/* =====================================
                          USER
                          ===================================== */}

                      <td className="min-w-[285px] px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#090b10]
                              text-white
                              shadow-sm

                              dark:bg-white
                              dark:text-black
                            "
                          >
                            <UserRound
                              size={18}
                              strokeWidth={1.8}
                            />
                          </div>

                          <div className="min-w-0">
                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-[13px]
                                  font-bold
                                  text-gray-900

                                  dark:text-white
                                "
                              >
                                {getUserName(user)}
                              </p>

                              {isSystemAdmin && (
                                <span
                                  className="
                                    rounded-full
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    px-2
                                    py-0.5
                                    text-[8px]
                                    font-semibold
                                    text-gray-500

                                    dark:border-slate-700
                                    dark:bg-slate-900
                                    dark:text-slate-400
                                  "
                                >
                                  Sistem Admini
                                </span>
                              )}
                            </div>

                            <p
                              className="
                                mt-0.5
                                truncate
                                text-[9px]
                                font-medium
                                text-gray-400

                                dark:text-slate-500
                              "
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* =====================================
                          ROLES
                          ===================================== */}

                      <td className="min-w-[360px] px-6 py-5">
                        {isSystemAdmin ? (
                          <div
                            className="
                              inline-flex
                              items-center
                              rounded-[12px]
                              border
                              border-gray-200
                              bg-white
                              px-4
                              py-2.5
                              shadow-[0_2px_8px_rgba(15,23,42,0.03)]

                              dark:border-slate-700
                              dark:bg-slate-900
                            "
                          >
                            <div>
                              <p
                                className="
                                  text-[11px]
                                  font-semibold
                                  text-gray-800

                                  dark:text-slate-200
                                "
                              >
                                Admin
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[8px]
                                  text-gray-400

                                  dark:text-slate-500
                                "
                              >
                                Sistem yöneticisi
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            {visibleRoles.map((role) => {
                              const checked = (user.roles || []).includes(
                                role.name
                              );

                              return (
                                <label
                                  key={role.id}
                                  className={`
                                    inline-flex
                                    min-h-[39px]
                                    cursor-pointer
                                    items-center
                                    gap-2.5
                                    rounded-[12px]
                                    border
                                    px-3.5
                                    py-2
                                    text-[10px]
                                    font-semibold
                                    shadow-[0_2px_8px_rgba(15,23,42,0.025)]
                                    transition

                                    ${
                                      checked
                                        ? `
                                          border-gray-300
                                          bg-gray-50
                                          text-gray-900

                                          hover:bg-gray-100

                                          dark:border-slate-600
                                          dark:bg-slate-800
                                          dark:text-white
                                        `
                                        : `
                                          border-gray-200
                                          bg-white
                                          text-gray-500

                                          hover:border-gray-300
                                          hover:bg-gray-50

                                          dark:border-slate-700
                                          dark:bg-slate-900
                                          dark:text-slate-400
                                          dark:hover:bg-slate-800
                                        `
                                    }
                                  `}
                                >
                                  <span
                                    className={`
                                      flex
                                      h-[16px]
                                      w-[16px]
                                      items-center
                                      justify-center
                                      rounded-[5px]
                                      border
                                      transition

                                      ${
                                        checked
                                          ? `
                                            border-gray-900
                                            bg-gray-900
                                            text-white

                                            dark:border-white
                                            dark:bg-white
                                            dark:text-black
                                          `
                                          : `
                                            border-gray-300
                                            bg-white

                                            dark:border-slate-600
                                            dark:bg-slate-900
                                          `
                                      }
                                    `}
                                  >
                                    {checked && (
                                      <svg
                                        viewBox="0 0 20 20"
                                        className="h-[11px] w-[11px]"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path
                                          d="M4 10.5 8 14l8-9"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                  </span>

                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={busy !== ""}
                                    onChange={(event) =>
                                      roleChange(
                                        user,
                                        role,
                                        event.target.checked
                                      )
                                    }
                                    className="sr-only"
                                  />

                                  {getRoleLabel(role.name)}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* =====================================
                          DEPARTMENT
                          ===================================== */}

                      <td className="min-w-[180px] px-6 py-5">
                        <span
                          className="
                            text-[11px]
                            font-semibold
                            text-gray-700

                            dark:text-slate-300
                          "
                        >
                          {user.department || "—"}
                        </span>
                      </td>

                      {/* =====================================
                          STATUS
                          ===================================== */}

                      <td className="min-w-[210px] px-6 py-5">

                        {/*
                         * Sistem Admininde aktif / pasif kontrolü
                         * tamamen gösterilmiyor.
                         */}

                        {isSystemAdmin ? (
                          <span
                            className="
                              text-[10px]
                              font-medium
                              text-gray-400

                              dark:text-slate-500
                            "
                          >
                            —
                          </span>
                        ) : (
                          <div
                            className="
                              inline-flex
                              rounded-[11px]
                              border
                              border-gray-200
                              bg-gray-50
                              p-1

                              dark:border-slate-700
                              dark:bg-slate-900
                            "
                          >
                            {/* ACTIVE */}

                            <button
                              type="button"
                              disabled={busy !== ""}
                              onClick={() =>
                                statusChange(user, true)
                              }
                              className={`
                                min-w-[68px]
                                rounded-[8px]
                                px-3
                                py-2
                                text-[10px]
                                font-semibold
                                transition

                                disabled:cursor-wait
                                disabled:opacity-60

                                ${
                                  user.isActive
                                    ? `
                                      bg-gray-900
                                      text-white
                                      shadow-sm

                                      dark:bg-white
                                      dark:text-black
                                    `
                                    : `
                                      bg-transparent
                                      text-gray-400

                                      hover:bg-white
                                      hover:text-gray-700

                                      dark:text-slate-500
                                      dark:hover:bg-slate-800
                                      dark:hover:text-slate-300
                                    `
                                }
                              `}
                            >
                              {busy === user.id ? "..." : "Aktif"}
                            </button>

                            {/* PASSIVE */}

                            <button
                              type="button"
                              disabled={busy !== ""}
                              onClick={() =>
                                statusChange(user, false)
                              }
                              className={`
                                min-w-[68px]
                                rounded-[8px]
                                px-3
                                py-2
                                text-[10px]
                                font-semibold
                                transition

                                disabled:cursor-wait
                                disabled:opacity-60

                                ${
                                  !user.isActive
                                    ? `
                                      bg-gray-500
                                      text-white
                                      shadow-sm

                                      dark:bg-slate-600
                                    `
                                    : `
                                      bg-transparent
                                      text-gray-400

                                      hover:bg-white
                                      hover:text-gray-700

                                      dark:text-slate-500
                                      dark:hover:bg-slate-800
                                      dark:hover:text-slate-300
                                    `
                                }
                              `}
                            >
                              {busy === user.id ? "..." : "Pasif"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-12 text-center">
              <p
                className="
                  text-[11px]
                  font-medium
                  text-gray-500
                "
              >
                Kullanıcı bulunamadı.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}