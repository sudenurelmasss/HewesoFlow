"use client";

import {
  use,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Copy,
  FolderKanban,
  Link2,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import {
  getMeetingById,
  MeetingItem,
} from "@/services/meetingService";

import {
  useCurrentUser,
} from "@/hooks/useCurrentUser";

/* =========================================================
   JITSI TYPES
   ========================================================= */

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;

        width?: string | number;
        height?: string | number;

        lang?: string;

        userInfo?: {
          displayName?: string;
          email?: string;
        };

        configOverwrite?: Record<
          string,
          unknown
        >;

        interfaceConfigOverwrite?: Record<
          string,
          unknown
        >;
      }
    ) => {
      dispose: () => void;

      addListener: (
        eventName: string,
        callback: (
          payload?: unknown
        ) => void
      ) => void;

      executeCommand: (
        command: string,
        ...args: unknown[]
      ) => void;
    };
  }
}

/* =========================================================
   PAGE
   ========================================================= */

export default function MeetingPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } =
    use(params);

  const {
    user,
  } =
    useCurrentUser();

  const [
    meeting,
    setMeeting,
  ] =
    useState<MeetingItem | null>(
      null
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
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    jitsiReady,
    setJitsiReady,
  ] =
    useState(false);

  const jitsiContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const apiRef =
    useRef<{
      dispose: () => void;

      addListener: (
        eventName: string,
        callback: (
          payload?: unknown
        ) => void
      ) => void;

      executeCommand: (
        command: string,
        ...args: unknown[]
      ) => void;
    } | null>(
      null
    );

  /* =========================================================
     LOAD MEETING
     ========================================================= */

  useEffect(
    () => {
      getMeetingById(
        id
      )
        .then(
          setMeeting
        )
        .catch(
          error =>
            setError(
              error instanceof Error
                ? error.message
                : "Toplantı açılamadı."
            )
        )
        .finally(
          () =>
            setLoading(
              false
            )
        );
    },
    [
      id,
    ]
  );

  /* =========================================================
     JITSI
     ========================================================= */

  useEffect(
    () => {
      if (
        !meeting ||
        !jitsiContainerRef.current
      ) {
        return;
      }

      let cancelled =
        false;

      let script =
        document.querySelector(
          'script[data-heweso-jitsi="true"]'
        ) as HTMLScriptElement | null;

      function createMeeting() {
        if (
          cancelled ||
          !meeting ||
          !jitsiContainerRef.current ||
          !window.JitsiMeetExternalAPI
        ) {
          return;
        }

        if (
          apiRef.current
        ) {
          apiRef.current.dispose();

          apiRef.current =
            null;
        }

        jitsiContainerRef.current.innerHTML =
          "";

        const fullName =
          user
            ? (
                `${user.firstName ?? ""} ` +
                `${user.lastName ?? ""}`
              ).trim()
            : "";

        const api =
          new window.JitsiMeetExternalAPI(
            "meet.jit.si",
            {
              roomName:
                meeting.roomName,

              parentNode:
                jitsiContainerRef.current,

              width:
                "100%",

              height:
                "100%",

              lang:
                "tr",

              userInfo:
                {
                  displayName:
                    fullName ||
                    "HewesoFlow Kullanıcısı",

                  email:
                    user?.email ||
                    undefined,
                },

              configOverwrite:
                {
                  prejoinConfig:
                    {
                      enabled:
                        true,

                      hideDisplayName:
                        true,

                      hideExtraJoinButtons:
                        [
                          "no-audio",
                          "by-phone",
                        ],

                      showHangUp:
                        false,
                    },

                  startWithAudioMuted:
                    false,

                  startWithVideoMuted:
                    false,

                  toolbarButtons:
                    [
                      "microphone",
                      "camera",
                      "desktop",
                      "chat",
                      "participants-pane",
                      "raisehand",
                      "tileview",
                      "select-background",
                      "settings",
                      "fullscreen",
                      "hangup",
                    ],

                  participantsPane:
                    {
                      hideModeratorSettingsTab:
                        true,

                      hideMoreActionsButton:
                        false,

                      hideMuteAllButton:
                        false,
                    },

                  securityUi:
                    {
                      hideLobbyButton:
                        true,

                      disableLobbyPassword:
                        true,
                    },

                  constraints:
                    {
                      video:
                        {
                          height:
                            {
                              ideal:
                                720,

                              max:
                                720,

                              min:
                                240,
                            },
                        },
                    },
                },

              interfaceConfigOverwrite:
                {
                  TILE_VIEW_MAX_COLUMNS:
                    3,

                  TOOLBAR_ALWAYS_VISIBLE:
                    false,

                  MOBILE_APP_PROMO:
                    false,

                  SHOW_JITSI_WATERMARK:
                    false,

                  SHOW_WATERMARK_FOR_GUESTS:
                    false,

                  SHOW_BRAND_WATERMARK:
                    false,

                  SHOW_POWERED_BY:
                    false,

                  DISPLAY_WELCOME_FOOTER:
                    false,

                  VIDEO_LAYOUT_FIT:
                    "both",
                },
            }
          );

        apiRef.current =
          api;

        api.addListener(
          "videoConferenceJoined",
          () => {
            setJitsiReady(
              true
            );
          }
        );

        api.addListener(
          "readyToClose",
          () => {
            window.history.back();
          }
        );
      }

      if (
        window.JitsiMeetExternalAPI
      ) {
        createMeeting();
      } else {
        if (!script) {
          script =
            document.createElement(
              "script"
            );

          script.src =
            "https://meet.jit.si/external_api.js";

          script.async =
            true;

          script.dataset.hewesoJitsi =
            "true";

          document.body.appendChild(
            script
          );
        }

        script.addEventListener(
          "load",
          createMeeting
        );
      }

      return () => {
        cancelled =
          true;

        script?.removeEventListener(
          "load",
          createMeeting
        );

        if (
          apiRef.current
        ) {
          apiRef.current.dispose();

          apiRef.current =
            null;
        }
      };
    },
    [
      meeting,
      user,
    ]
  );

  /* =========================================================
     COPY LINK
     ========================================================= */

  async function copyMeetingLink() {
    try {
      await navigator
        .clipboard
        .writeText(
          window.location.href
        );

      setCopied(
        true
      );

      window.setTimeout(
        () =>
          setCopied(
            false
          ),
        1800
      );
    } catch {
      setCopied(
        false
      );
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main
        className="
          min-h-screen
          px-6
          py-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1380px]
            rounded-[24px]
            border
            border-white/80
            bg-white/90
            p-8
            text-[13px]
            font-medium
            text-gray-500
            shadow-sm
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081321]
            dark:text-slate-400
          "
        >
          Toplantı yükleniyor...
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (
    error ||
    !meeting
  ) {
    return (
      <main
        className="
          min-h-screen
          px-6
          py-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1380px]
            rounded-[20px]
            border
            border-red-200
            bg-red-50
            p-5
            text-[13px]
            font-medium
            text-red-600

            dark:border-red-500/30
            dark:bg-red-500/10
            dark:text-red-300
          "
        >
          {error ||
            "Toplantı bulunamadı."}
        </div>
      </main>
    );
  }

  /* =========================================================
     DATA
     ========================================================= */

  const start =
    new Date(
      meeting.startDateTime
    );

  const end =
    new Date(
      meeting.endDateTime
    );

  /*
   * Admin toplantılarında AudienceLabel:
   *
   * Yazılım + İnsan Kaynakları
   *
   * şeklinde geldiği için departmanları
   * ayrı ayrı gösteriyoruz.
   */
  const audienceItems =
    meeting.audienceLabel
      .split("+")
      .map(
        item =>
          item.trim()
      )
      .filter(
        Boolean
      );

  /* =========================================================
     VIEW
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        px-6
        py-7
        pb-12
        text-gray-950

        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          max-w-[1380px]
        "
      >
        {/* ===================================================
            ACTION BAR
            =================================================== */}

        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <button
            type="button"
            onClick={() =>
              history.back()
            }
            className="
              inline-flex
              h-[44px]
              items-center
              gap-2
              rounded-[12px]
              border
              border-gray-200
              bg-white/90
              px-4
              text-[13px]
              font-medium
              text-gray-600
              shadow-sm
              transition

              hover:bg-white
              hover:text-gray-900

              dark:border-slate-700
              dark:bg-[#081321]
              dark:text-slate-300
            "
          >
            <ArrowLeft
              size={16}
            />

            Takvime dön
          </button>

          <button
            type="button"
            onClick={
              copyMeetingLink
            }
            className="
              inline-flex
              h-[44px]
              items-center
              gap-2
              rounded-[12px]
              border
              border-gray-200
              bg-white/90
              px-4
              text-[13px]
              font-medium
              text-gray-600
              shadow-sm
              transition

              hover:bg-white
              hover:text-gray-900

              dark:border-slate-700
              dark:bg-[#081321]
              dark:text-slate-300
            "
          >
            {copied ? (
              <Link2
                size={16}
              />
            ) : (
              <Copy
                size={16}
              />
            )}

            {copied
              ? "Bağlantı kopyalandı"
              : "Toplantı bağlantısı"}
          </button>
        </div>

        {/* ===================================================
            MEETING HEADER
            =================================================== */}

        <section
          className="
            mb-4
            rounded-[26px]
            border
            border-white/80
            bg-white/92
            p-6
            shadow-[0_12px_36px_rgba(15,23,42,0.06)]
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081321]/95
          "
        >
          {/* TITLE */}

          <div>
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-blue-50
                px-3
                py-1.5
                text-[10px]
                font-bold
                text-blue-600

                dark:bg-blue-400/10
                dark:text-blue-300
              "
            >
              <Video
                size={12}
              />

              Online toplantı
            </div>

            <h1
              className="
                mt-3
                text-[28px]
                font-bold
                tracking-[-0.04em]
                text-gray-950

                dark:text-white
              "
            >
              {
                meeting.title
              }
            </h1>

            {meeting.description && (
              <p
                className="
                  mt-2
                  max-w-4xl
                  text-[12px]
                  leading-5
                  text-gray-500

                  dark:text-slate-400
                "
              >
                {
                  meeting.description
                }
              </p>
            )}
          </div>

          {/* =================================================
              INFORMATION
              ================================================= */}

          <div
            className="
              mt-5
              grid
              gap-3

              md:grid-cols-2
              xl:grid-cols-[1.7fr_1fr_1fr_1fr_1.2fr]
            "
          >
            {/* =================================================
                DEPARTMENTS / PROJECT
                ================================================= */}

            <div
              className="
                min-h-[78px]
                rounded-[15px]
                border
                border-gray-100
                bg-gray-50/80
                px-4
                py-3.5

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-gray-400

                  dark:text-slate-500
                "
              >
                {meeting.scopeType ===
                1 ? (
                  <Building2
                    size={14}
                  />
                ) : (
                  <FolderKanban
                    size={14}
                  />
                )}

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.11em]
                  "
                >
                  {meeting.scopeType ===
                  1
                    ? "Departmanlar"
                    : "Proje"}
                </span>
              </div>

              {/* ADMIN - DEPARTMENTS */}

              {meeting.scopeType ===
              1 ? (
                <div
                  className="
                    mt-2.5
                    flex
                    flex-wrap
                    gap-1.5
                  "
                >
                  {audienceItems.map(
                    department => (
                      <span
                        key={
                          department
                        }
                        className="
                          inline-flex
                          items-center
                          rounded-[7px]
                          border
                          border-blue-200
                          bg-blue-50
                          px-2.5
                          py-1.5
                          text-[10px]
                          font-semibold
                          text-blue-700

                          dark:border-blue-400/25
                          dark:bg-blue-400/[0.08]
                          dark:text-blue-200
                        "
                      >
                        {
                          department
                        }
                      </span>
                    )
                  )}
                </div>
              ) : (
                /* PROJECT MANAGER */

                <p
                  className="
                    mt-2.5
                    truncate
                    text-[12px]
                    font-semibold
                    text-gray-700

                    dark:text-slate-200
                  "
                >
                  {meeting.projectName ||
                    meeting.audienceLabel}
                </p>
              )}
            </div>

            {/* =================================================
                DATE
                ================================================= */}

            <div
              className="
                min-h-[78px]
                rounded-[15px]
                border
                border-gray-100
                bg-gray-50/80
                px-4
                py-3.5

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-gray-400

                  dark:text-slate-500
                "
              >
                <CalendarDays
                  size={14}
                />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.11em]
                  "
                >
                  Tarih
                </span>
              </div>

              <p
                className="
                  mt-2.5
                  text-[12px]
                  font-semibold
                  text-gray-700

                  dark:text-slate-200
                "
              >
                {start.toLocaleDateString(
                  "tr-TR"
                )}
              </p>
            </div>

            {/* =================================================
                TIME
                ================================================= */}

            <div
              className="
                min-h-[78px]
                rounded-[15px]
                border
                border-gray-100
                bg-gray-50/80
                px-4
                py-3.5

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-gray-400

                  dark:text-slate-500
                "
              >
                <Clock3
                  size={14}
                />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.11em]
                  "
                >
                  Saat
                </span>
              </div>

              <p
                className="
                  mt-2.5
                  whitespace-nowrap
                  text-[12px]
                  font-semibold
                  text-gray-700

                  dark:text-slate-200
                "
              >
                {start.toLocaleTimeString(
                  "tr-TR",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",
                  }
                )}

                {" — "}

                {end.toLocaleTimeString(
                  "tr-TR",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",
                  }
                )}
              </p>
            </div>

            {/* =================================================
                PARTICIPANTS
                ================================================= */}

            <div
              className="
                min-h-[78px]
                rounded-[15px]
                border
                border-gray-100
                bg-gray-50/80
                px-4
                py-3.5

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-gray-400

                  dark:text-slate-500
                "
              >
                <Users
                  size={14}
                />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.11em]
                  "
                >
                  Katılımcılar
                </span>
              </div>

              <p
                className="
                  mt-2.5
                  text-[12px]
                  font-semibold
                  text-gray-700

                  dark:text-slate-200
                "
              >
                {
                  meeting.participantCount
                }{" "}
                kişi
              </p>
            </div>

            {/* =================================================
                CREATED BY
                ================================================= */}

            <div
              className="
                min-h-[78px]
                rounded-[15px]
                border
                border-gray-100
                bg-gray-50/80
                px-4
                py-3.5

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-gray-400

                  dark:text-slate-500
                "
              >
                <UserRound
                  size={14}
                />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.11em]
                  "
                >
                  Oluşturan
                </span>
              </div>

              <p
                className="
                  mt-2.5
                  truncate
                  text-[12px]
                  font-semibold
                  text-gray-700

                  dark:text-slate-200
                "
                title={
                  meeting.createdByUserName
                }
              >
                {
                  meeting.createdByUserName
                }
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            VIDEO
            =================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[26px]
            border
            border-slate-800
            bg-[#111214]
            shadow-[0_18px_55px_rgba(0,0,0,.18)]
          "
        >
          {/* =================================================
              HEWESOFLOW BAR
              ================================================= */}

          <div
            className="
              flex
              h-[56px]
              items-center
              justify-between
              border-b
              border-white/[0.06]
              bg-[#17181b]
              px-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-[9px]
                  bg-blue-500
                  text-white
                "
              >
                <Video
                  size={15}
                />
              </div>

              <div>
                <p
                  className="
                    text-[12px]
                    font-semibold
                    text-white
                  "
                >
                  HewesoFlow Meeting
                </p>

                <p
                  className="
                    mt-0.5
                    max-w-[420px]
                    truncate
                    text-[9px]
                    font-medium
                    text-slate-500
                  "
                >
                  {
                    meeting.title
                  }
                </p>
              </div>
            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-emerald-500/10
                px-3
                py-1.5
                text-[9px]
                font-bold
                text-emerald-400
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-400
                "
              />

              Görüşme hazır
            </div>
          </div>

          {/* =================================================
              JITSI
              ================================================= */}

          <div
            className="
              relative
              h-[650px]
              min-h-[600px]
              w-full
              bg-[#111214]

              [&>iframe]:h-full
              [&>iframe]:w-full
              [&>iframe]:border-0
            "
          >
            {!jitsiReady && (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-0
                  flex
                  items-center
                  justify-center
                  bg-[#111214]
                "
              >
                <div
                  className="
                    text-center
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-500/10
                      text-blue-400
                    "
                  >
                    <Video
                      size={20}
                    />
                  </div>

                  <p
                    className="
                      mt-3
                      text-[12px]
                      font-semibold
                      text-white
                    "
                  >
                    Görüşme hazırlanıyor
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-slate-500
                    "
                  >
                    Kamera ve mikrofon
                    bağlantısı kontrol ediliyor.
                  </p>
                </div>
              </div>
            )}

            <div
              ref={
                jitsiContainerRef
              }
              className="
                relative
                z-10
                h-full
                w-full
              "
            />
          </div>
        </section>
      </div>
    </main>
  );
}