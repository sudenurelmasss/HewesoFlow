"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Building2,
  Plus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  createDepartment,
  Department,
  getDepartments,
} from "@/services/departmentService";

import {
  getProjectManagerOptions,
  ProjectManagerOption,
} from "@/services/projectManagerOptionService";

export default function DepartmentsPage() {
  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([]);

  const [
    departmentManagers,
    setDepartmentManagers,
  ] = useState<
    Record<string, ProjectManagerOption[]>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getDepartments();

      setDepartments(result);

      const managerResults =
        await Promise.all(
          result.map(
            async (
              department
            ) => {
              try {
                const managers =
                  await getProjectManagerOptions(
                    department.id
                  );

                return {
                  departmentId:
                    department.id,

                  managers,
                };
              } catch {
                return {
                  departmentId:
                    department.id,

                  managers: [],
                };
              }
            }
          )
        );

      const managerMap: Record<
        string,
        ProjectManagerOption[]
      > = {};

      managerResults.forEach(
        (result) => {
          managerMap[
            result.departmentId
          ] =
            result.managers;
        }
      );

      setDepartmentManagers(
        managerMap
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Departmanlar yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const value =
        name.trim();

      if (!value) {
        throw new Error(
          "Departman adı zorunludur."
        );
      }

      await createDepartment({
        name: value,
      });

      setName("");

      setShowModal(false);

      await loadData();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Departman oluşturulamadı."
      );
    } finally {
      setCreating(false);
    }
  }

  const totalUsers =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        (
          department.userCount ??
          0
        ),
      0
    );

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-8">
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
                  dark:border-t-blue-400
                "
              />

              <p
                className="
                  mt-4
                  text-[12px]
                  font-medium
                  text-gray-500

                  dark:text-slate-400
                "
              >
                Departmanlar yükleniyor...
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
              Organizasyon Yönetimi
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
              Departmanlar
            </h1>

            <p
              className="
                mt-1.5
                text-[13px]
                text-gray-500

                dark:text-slate-400
              "
            >
              Departmanları ve ekip dağılımını görüntüleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setName("");
              setCreateError("");
              setShowModal(true);
            }}
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
              dark:shadow-[0_0_24px_rgba(59,130,246,0.08)]

              dark:hover:border-blue-400/40
              dark:hover:bg-[#0c1b30]
            "
          >
            <Plus
              size={16}
            />

            Yeni Departman
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mt-6 flex flex-wrap gap-4">

          {/* DEPARTMENT COUNT */}

          <div
            className="
              flex
              min-w-[230px]
              items-center
              gap-4
              rounded-[18px]
              border
              border-gray-200/80
              bg-white/80
              px-5
              py-4
              shadow-[0_6px_20px_rgba(15,23,42,0.045)]
              backdrop-blur-lg

              dark:border-slate-800
              dark:bg-[#081321]/95
              dark:shadow-[0_12px_35px_rgba(0,0,0,0.25)]
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-[12px]
                border
                border-gray-100
                bg-white
                text-gray-500

                dark:border-slate-700
                dark:bg-[#0d1a2b]
                dark:text-slate-300
              "
            >
              <Building2
                size={19}
              />
            </div>

            <div>
              <div className="flex items-baseline gap-2.5">
                <span
                  className="
                    text-[22px]
                    font-bold
                    leading-none
                    text-gray-900

                    dark:text-white
                  "
                >
                  {
                    departments.length
                  }
                </span>

                <span
                  className="
                    text-[12px]
                    font-semibold
                    text-gray-600

                    dark:text-slate-300
                  "
                >
                  Departman
                </span>
              </div>

              <p
                className="
                  mt-1.5
                  text-[10px]
                  text-gray-400

                  dark:text-slate-500
                "
              >
                Toplam departman
              </p>
            </div>
          </div>

          {/* ACTIVE USERS */}

          <div
            className="
              flex
              min-w-[245px]
              items-center
              gap-4
              rounded-[18px]
              border
              border-gray-200/80
              bg-white/80
              px-5
              py-4
              shadow-[0_6px_20px_rgba(15,23,42,0.045)]
              backdrop-blur-lg

              dark:border-slate-800
              dark:bg-[#081321]/95
              dark:shadow-[0_12px_35px_rgba(0,0,0,0.25)]
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-[12px]
                border
                border-gray-100
                bg-white
                text-gray-500

                dark:border-slate-700
                dark:bg-[#0d1a2b]
                dark:text-slate-300
              "
            >
              <Users
                size={19}
              />
            </div>

            <div>
              <div className="flex items-baseline gap-2.5">
                <span
                  className="
                    text-[22px]
                    font-bold
                    leading-none
                    text-gray-900

                    dark:text-white
                  "
                >
                  {
                    totalUsers
                  }
                </span>

                <span
                  className="
                    text-[12px]
                    font-semibold
                    text-gray-600

                    dark:text-slate-300
                  "
                >
                  Aktif Kullanıcı
                </span>
              </div>

              <p
                className="
                  mt-1.5
                  text-[10px]
                  text-gray-400

                  dark:text-slate-500
                "
              >
                Tüm departmanlarda
              </p>
            </div>
          </div>
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

              dark:border-red-500/30
              dark:bg-red-500/10
              dark:text-red-300
            "
          >
            {
              error
            }
          </div>
        )}

        {/* DEPARTMENT CARDS */}

        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {departments.map(
            (
              department,
              index
            ) => {
              const managers =
                departmentManagers[
                  department.id
                ] ?? [];

              const theme =
                index % 3 === 0
                  ? {
                      border:
                        "border-indigo-300 dark:border-blue-400/35",

                      icon:
                        "bg-indigo-50 text-indigo-500 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-1 dark:ring-blue-400/25",

                      glow:
                        "dark:shadow-[0_0_28px_rgba(59,130,246,0.06)]",
                    }
                  : index % 3 ===
                      1
                    ? {
                        border:
                          "border-emerald-300 dark:border-emerald-400/35",

                        icon:
                          "bg-emerald-50 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/25",

                        glow:
                          "dark:shadow-[0_0_28px_rgba(52,211,153,0.05)]",
                      }
                    : {
                        border:
                          "border-orange-300 dark:border-orange-400/35",

                        icon:
                          "bg-orange-50 text-orange-500 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-1 dark:ring-orange-400/25",

                        glow:
                          "dark:shadow-[0_0_28px_rgba(251,146,60,0.05)]",
                      };

              return (
                <article
                  key={
                    department.id
                  }
                  className={`
                    rounded-[26px]
                    border-[1.5px]
                    bg-white/85
                    p-6
                    shadow-[0_10px_34px_rgba(15,23,42,0.045)]
                    backdrop-blur-xl
                    transition-all
                    duration-200

                    hover:-translate-y-1
                    hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]

                    dark:bg-[#081321]/96
                    dark:hover:bg-[#0a1727]

                    ${theme.border}
                    ${theme.glow}
                  `}
                >
                  {/* DEPARTMENT HEADER */}

                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-[15px]

                        ${theme.icon}
                      `}
                    >
                      <Building2
                        size={21}
                      />
                    </div>

                    <div className="min-w-0">
                      <h2
                        className="
                          truncate
                          text-[19px]
                          font-bold
                          tracking-[-0.03em]
                          text-gray-950

                          dark:text-white
                        "
                      >
                        {
                          department.name
                        }
                      </h2>

                      <div className="mt-1.5 flex items-center gap-2">
                        <Users
                          size={12}
                          className="
                            text-gray-400

                            dark:text-slate-500
                          "
                        />

                        <span
                          className="
                            text-[10px]
                            font-medium
                            text-gray-500

                            dark:text-slate-400
                          "
                        >
                          {
                            department.userCount ??
                            0
                          }{" "}
                          aktif kullanıcı
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER */}

                  <div
                    className="
                      my-5
                      h-px
                      bg-gray-100

                      dark:bg-slate-800
                    "
                  />

                  {/* MANAGER TITLE */}

                  <div className="flex items-center justify-between gap-3">
                    <p
                      className="
                        text-[13px]
                        font-bold
                        text-gray-700

                        dark:text-slate-200
                      "
                    >
                      Proje Yöneticileri
                    </p>

                    {managers.length >
                      0 && (
                      <span
                        className="
                          rounded-lg
                          border
                          border-gray-200
                          bg-white
                          px-2
                          py-1
                          text-[9px]
                          font-bold
                          text-gray-500

                          dark:border-slate-700
                          dark:bg-slate-900
                          dark:text-slate-400
                        "
                      >
                        {
                          managers.length
                        }{" "}
                        kişi
                      </span>
                    )}
                  </div>

                  {/* NO MANAGER */}

                  {managers.length ===
                  0 ? (
                    <div
                      className="
                        mt-4
                        rounded-[16px]
                        border
                        border-red-200
                        bg-red-50/80
                        px-5
                        py-4

                        dark:border-red-500/30
                        dark:bg-red-500/[0.08]
                      "
                    >
                      <p
                        className="
                          text-[12px]
                          font-bold
                          text-red-600

                          dark:text-red-300
                        "
                      >
                        Project Manager yok
                      </p>

                      <p
                        className="
                          mt-1.5
                          text-[10px]
                          font-medium
                          text-red-400

                          dark:text-red-400/75
                        "
                      >
                        Admin panelinden yetki verilebilir.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {managers.map(
                        (
                          manager
                        ) => (
                          <div
                            key={
                              manager.id
                            }
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-[15px]
                              border
                              border-gray-200
                              bg-white/80
                              px-3.5
                              py-3
                              shadow-[0_2px_8px_rgba(15,23,42,0.025)]
                              transition

                              hover:border-gray-300
                              hover:bg-white

                              dark:border-slate-700
                              dark:bg-[#0d1a2b]
                              dark:shadow-none

                              dark:hover:border-slate-600
                              dark:hover:bg-[#102034]
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
                                rounded-full
                                border
                                border-gray-200
                                bg-white
                                text-gray-600

                                dark:border-slate-600
                                dark:bg-[#07111f]
                                dark:text-slate-300
                              "
                            >
                              <UserRound
                                size={15}
                              />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  truncate
                                  text-[11px]
                                  font-bold
                                  text-gray-800

                                  dark:text-slate-100
                                "
                              >
                                {
                                  manager.fullName
                                }
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-[9px]
                                  text-gray-400

                                  dark:text-slate-500
                                "
                              >
                                {
                                  manager.email
                                }
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>

        {/* EMPTY */}

        {departments.length ===
          0 && (
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
              backdrop-blur-lg

              dark:border-slate-800
              dark:bg-[#081321]/95
            "
          >
            <Building2
              size={30}
              className="
                mx-auto
                text-gray-300

                dark:text-slate-600
              "
            />

            <p
              className="
                mt-4
                text-[14px]
                font-bold
                text-gray-700

                dark:text-slate-200
              "
            >
              Henüz departman yok
            </p>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}

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

            dark:bg-black/60
          "
          onMouseDown={() => {
            if (!creating) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-[400px]
              rounded-[22px]
              border
              border-white/90
              bg-white
              p-6
              shadow-2xl

              dark:border-slate-700
              dark:bg-[#081321]
            "
            onMouseDown={(
              event
            ) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-gray-400

                    dark:text-slate-500
                  "
                >
                  Yeni Departman
                </p>

                <h2
                  className="
                    mt-2
                    text-[20px]
                    font-bold
                    tracking-[-0.025em]
                    text-gray-900

                    dark:text-white
                  "
                >
                  Departman oluştur
                </h2>

                <p
                  className="
                    mt-1.5
                    text-[10px]
                    leading-4
                    text-gray-500

                    dark:text-slate-400
                  "
                >
                  Departman oluşturmak için yalnızca bir isim girmeniz yeterlidir.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  creating
                }
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-400
                  transition

                  hover:bg-gray-100
                  hover:text-gray-700

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
                handleCreate
              }
              className="mt-5"
            >
              <label
                className="
                  mb-2
                  block
                  text-[10px]
                  font-bold
                  text-gray-700

                  dark:text-slate-300
                "
              >
                Departman adı
              </label>

              <input
                autoFocus
                value={
                  name
                }
                disabled={
                  creating
                }
                onChange={(
                  event
                ) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Örn. Yazılım"
                maxLength={
                  150
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
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-300

                  focus:border-gray-400

                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-white
                  dark:placeholder:text-slate-600
                  dark:focus:border-blue-400/50
                "
              />

              {createError && (
                <div
                  className="
                    mt-3
                    rounded-lg
                    bg-red-50
                    px-3
                    py-2.5
                    text-[10px]
                    font-medium
                    text-red-600

                    dark:border
                    dark:border-red-500/30
                    dark:bg-red-500/10
                    dark:text-red-300
                  "
                >
                  {
                    createError
                  }
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={
                    creating
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
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

                    hover:bg-gray-50

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
                    !name.trim()
                  }
                  className="
                    rounded-xl
                    bg-black
                    px-4
                    py-2.5
                    text-[10px]
                    font-bold
                    text-white
                    transition

                    hover:bg-gray-800

                    dark:border
                    dark:border-blue-400/20
                    dark:bg-blue-500/15
                    dark:text-blue-200

                    dark:hover:bg-blue-500/20

                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {creating
                    ? "Oluşturuluyor..."
                    : "Departmanı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}