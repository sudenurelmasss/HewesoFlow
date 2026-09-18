"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  ForbiddenError,
  getTeamMembers,
  TeamMember,
} from "@/services/teamService";

/* =========================================================
   HELPERS
   ========================================================= */

function getDisplayName(
  member: TeamMember
) {
  if (
    member.fullName?.trim()
  ) {
    return member.fullName.trim();
  }

  const fullName =
    `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();

  if (fullName) {
    return fullName;
  }

  return (
    member.email ||
    "İsimsiz Kullanıcı"
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function TeamPage() {
  const [
    members,
    setMembers,
  ] =
    useState<TeamMember[]>(
      []
    );

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
    forbidden,
    setForbidden,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /* =======================================================
     LOAD
     ======================================================= */

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const result =
        await getTeamMembers();

      setMembers(
        result
      );
    } catch (error) {
      if (
        error instanceof
        ForbiddenError
      ) {
        setForbidden(true);
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Ekip bilgileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    () => {
      loadMembers();

      function handleFocus() {
        loadMembers();
      }

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    []
  );

  /* =======================================================
     SEARCH
     ======================================================= */

  const filteredMembers =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            );

        if (!value) {
          return members;
        }

        return members.filter(
          member => {
            const searchable =
              [
                getDisplayName(
                  member
                ),

                member.email ??
                  "",

                member.role ??
                  "Team Member",

                member.department ??
                  "",
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "tr-TR"
                );

            return searchable.includes(
              value
            );
          }
        );
      },
      [
        members,
        search,
      ]
    );

  /* =======================================================
     COUNTS
     ======================================================= */

  const activeMembers =
    members.filter(
      member =>
        member.isActive !==
        false
    ).length;

  const passiveMembers =
    members.length -
    activeMembers;

  /* =========================================================
     VIEW
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        px-6
        py-8
        pb-24
        text-gray-950

        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          max-w-[1280px]
        "
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <div
          className="
            mb-7
          "
        >
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
            Organizasyon Yönetimi
          </p>

          <h1
            className="
              mt-2
              text-[30px]
              font-bold
              tracking-[-0.04em]
              text-gray-950

              dark:text-white
            "
          >
            Ekip
          </h1>

          <p
            className="
              mt-2
              text-[11px]
              font-medium
              text-gray-500

              dark:text-slate-400
            "
          >
            Kullanıcıları,
            rollerini ve departman
            dağılımlarını görüntüleyin.
          </p>
        </div>

        {/* ===================================================
            LOADING
            =================================================== */}

        {loading && (
          <div
            className="
              rounded-[24px]
              border
              border-white/80
              bg-white/90
              p-16
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
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-gray-200
                border-t-blue-500
              "
            />

            <p
              className="
                text-[11px]
                font-medium
                text-gray-500

                dark:text-slate-400
              "
            >
              Ekip bilgileri
              yükleniyor...
            </p>
          </div>
        )}

        {/* ===================================================
            FORBIDDEN
            =================================================== */}

        {!loading &&
          forbidden && (
            <div
              className="
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
                <ShieldCheck
                  size={24}
                />
              </div>

              <h2
                className="
                  mt-5
                  text-[18px]
                  font-bold
                "
              >
                Bu alan için
                yetkiniz bulunmuyor
              </h2>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-lg
                  text-[11px]
                  leading-5
                  text-gray-500

                  dark:text-slate-400
                "
              >
                Ekip bilgileri
                yalnızca yetkili
                kullanıcılar tarafından
                görüntülenebilir.
              </p>
            </div>
          )}

        {/* ===================================================
            ERROR
            =================================================== */}

        {!loading &&
          !forbidden &&
          error && (
            <div
              className="
                rounded-[22px]
                border
                border-red-200
                bg-red-50
                p-6

                dark:border-red-500/30
                dark:bg-red-500/10
              "
            >
              <p
                className="
                  text-[13px]
                  font-semibold
                  text-red-600
                "
              >
                Ekip yüklenemedi
              </p>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-red-500/80
                "
              >
                {error}
              </p>

              <button
                type="button"
                onClick={
                  loadMembers
                }
                className="
                  mt-4
                  rounded-xl
                  bg-black
                  px-4
                  py-2.5
                  text-[11px]
                  font-semibold
                  text-white
                "
              >
                Tekrar dene
              </button>
            </div>
          )}

        {/* ===================================================
            CONTENT
            =================================================== */}

        {!loading &&
          !forbidden &&
          !error && (
            <>
              {/* =================================================
                  STAT CARDS
                  ================================================= */}

              <div
                className="
                  mb-5
                  grid
                  gap-4

                  md:grid-cols-3
                "
              >
                {/* TOTAL */}

                <div
                  className="
                    flex
                    min-h-[88px]
                    items-center
                    gap-4
                    rounded-[18px]
                    border
                    border-white/80
                    bg-white/90
                    px-5
                    py-4
                    shadow-[0_6px_22px_rgba(15,23,42,0.04)]
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
                    <UsersRound
                      size={18}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-gray-400
                      "
                    >
                      Toplam Üye
                    </p>

                    <p
                      className="
                        mt-1
                        text-[24px]
                        font-bold
                        tracking-[-0.03em]
                      "
                    >
                      {
                        members.length
                      }
                    </p>
                  </div>
                </div>

                {/* ACTIVE */}

                <div
                  className="
                    flex
                    min-h-[88px]
                    items-center
                    gap-4
                    rounded-[18px]
                    border
                    border-white/80
                    bg-white/90
                    px-5
                    py-4
                    shadow-[0_6px_22px_rgba(15,23,42,0.04)]
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
                      bg-sky-50
                      text-sky-500

                      dark:bg-sky-400/10
                      dark:text-sky-300
                    "
                  >
                    <UserRound
                      size={18}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-gray-400
                      "
                    >
                      Aktif
                    </p>

                    <p
                      className="
                        mt-1
                        text-[24px]
                        font-bold
                        tracking-[-0.03em]
                      "
                    >
                      {
                        activeMembers
                      }
                    </p>
                  </div>
                </div>

                {/* PASSIVE */}

                <div
                  className="
                    flex
                    min-h-[88px]
                    items-center
                    gap-4
                    rounded-[18px]
                    border
                    border-white/80
                    bg-white/90
                    px-5
                    py-4
                    shadow-[0_6px_22px_rgba(15,23,42,0.04)]
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
                      bg-gray-100
                      text-gray-400

                      dark:bg-slate-800
                      dark:text-slate-500
                    "
                  >
                    <UserRound
                      size={18}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-gray-400
                      "
                    >
                      Pasif
                    </p>

                    <p
                      className="
                        mt-1
                        text-[24px]
                        font-bold
                        tracking-[-0.03em]
                      "
                    >
                      {
                        passiveMembers
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SEARCH
                  ================================================= */}

              <div
                className="
                  mb-5
                  rounded-[18px]
                  border
                  border-white/80
                  bg-white/90
                  p-3
                  shadow-[0_6px_22px_rgba(15,23,42,0.04)]
                  backdrop-blur-xl

                  dark:border-slate-800
                  dark:bg-[#081321]
                "
              >
                <div
                  className="
                    relative
                  "
                >
                  <Search
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-400

                      dark:text-slate-500
                    "
                  />

                  <input
                    value={
                      search
                    }
                    onChange={
                      event =>
                        setSearch(
                          event.target.value
                        )
                    }
                    placeholder="İsim, e-posta, rol veya departman ara..."
                    className="
                      w-full
                      rounded-[12px]
                      border
                      border-transparent
                      bg-gray-50/90
                      py-3.5
                      pl-11
                      pr-4
                      text-[11px]
                      text-gray-700
                      outline-none
                      transition

                      placeholder:text-gray-400

                      focus:border-gray-200
                      focus:bg-white

                      dark:bg-slate-900
                      dark:text-white
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  EMPTY
                  ================================================= */}

              {filteredMembers.length ===
              0 ? (
                <div
                  className="
                    rounded-[24px]
                    border
                    border-dashed
                    border-gray-300
                    bg-white/80
                    p-16
                    text-center

                    dark:border-slate-700
                    dark:bg-[#081321]/90
                  "
                >
                  <UsersRound
                    size={28}
                    className="
                      mx-auto
                      text-gray-300
                    "
                  />

                  <h2
                    className="
                      mt-4
                      text-[15px]
                      font-semibold
                    "
                  >
                    Kullanıcı bulunamadı
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-gray-500
                    "
                  >
                    Arama kriterlerinize
                    uygun kullanıcı
                    bulunamadı.
                  </p>
                </div>
              ) : (
                /* =================================================
                   MEMBER CARDS
                   ================================================= */

                <div
                  className="
                    grid
                    gap-5

                    md:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {filteredMembers.map(
                    (
                      member,
                      index
                    ) => {
                      const active =
                        member.isActive !==
                        false;

                      const role =
                        member.role ||
                        "Team Member";

                      return (
                        <article
                          key={
                            member.id ||
                            member.userId ||
                            index
                          }
                          className="
                            rounded-[20px]
                            border
                            border-white/80
                            bg-white/92
                            p-5
                            shadow-[0_7px_25px_rgba(15,23,42,0.045)]
                            backdrop-blur-xl
                            transition

                            hover:-translate-y-[1px]
                            hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]

                            dark:border-slate-800
                            dark:bg-[#081321]/95
                          "
                        >
                          {/* =====================================
                              TOP
                              ===================================== */}

                          <div
                            className="
                              flex
                              items-start
                              justify-between
                              gap-4
                            "
                          >
                            {/* AVATAR */}

                            <div
                              className="
                                flex
                                h-11
                                w-11
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
                                size={20}
                                strokeWidth={1.8}
                              />
                            </div>

                            {/* STATUS */}

                            {active ? (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  rounded-[9px]
                                  border
                                  border-sky-300
                                  bg-sky-50
                                  px-3.5
                                  py-1.5
                                  text-[10px]
                                  font-bold
                                  text-sky-600
                                  whitespace-nowrap

                                  dark:border-sky-400/40
                                  dark:bg-sky-400/10
                                  dark:text-sky-300
                                "
                              >
                                Aktif
                              </span>
                            ) : (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  rounded-[9px]
                                  border
                                  border-gray-200
                                  bg-gray-100
                                  px-3.5
                                  py-1.5
                                  text-[10px]
                                  font-bold
                                  text-gray-500
                                  whitespace-nowrap

                                  dark:border-slate-700
                                  dark:bg-slate-800
                                  dark:text-slate-400
                                "
                              >
                                Pasif
                              </span>
                            )}
                          </div>

                          {/* =====================================
                              USER
                              ===================================== */}

                          <div
                            className="
                              mt-4
                            "
                          >
                            <h2
                              className="
                                truncate
                                text-[16px]
                                font-bold
                                tracking-[-0.02em]
                                text-gray-900

                                dark:text-white
                              "
                            >
                              {
                                getDisplayName(
                                  member
                                )
                              }
                            </h2>

                            <p
                              className="
                                mt-1
                                truncate
                                text-[11px]
                                font-medium
                                text-gray-400

                                dark:text-slate-500
                              "
                            >
                              {member.email ||
                                "E-posta bulunmuyor"}
                            </p>
                          </div>

                          {/* =====================================
                              DETAILS
                              ===================================== */}

                          <div
                            className="
                              mt-5
                              space-y-3.5
                              border-t
                              border-gray-100
                              pt-4

                              dark:border-slate-800
                            "
                          >
                            {/* ROLE */}

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-4
                              "
                            >
                              <span
                                className="
                                  text-[10px]
                                  font-medium
                                  text-gray-400

                                  dark:text-slate-500
                                "
                              >
                                Rol
                              </span>

                              <span
                                className="
                                  text-right
                                  text-[11px]
                                  font-semibold
                                  text-gray-700

                                  dark:text-slate-300
                                "
                              >
                                {
                                  role
                                }
                              </span>
                            </div>

                            {/* DEPARTMENT */}

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-4
                              "
                            >
                              <span
                                className="
                                  text-[10px]
                                  font-medium
                                  text-gray-400

                                  dark:text-slate-500
                                "
                              >
                                Departman
                              </span>

                              <span
                                className="
                                  max-w-[68%]
                                  truncate
                                  text-right
                                  text-[11px]
                                  font-semibold
                                  text-gray-700

                                  dark:text-slate-300
                                "
                              >
                                {member.department ||
                                  "Departman yok"}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </>
          )}
      </div>
    </main>
  );
}