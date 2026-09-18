"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  FolderKanban,
  LockKeyhole,
  MessageSquareText,
  RefreshCcw,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
  NotificationForbiddenError,
  NotificationItem,
} from "@/services/notificationService";

import {
  useCurrentUser,
} from "@/hooks/useCurrentUser";

/* =========================================================
   DATE
   ========================================================= */

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Tarih yok";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeText(
  value?: string | null
) {
  return (
    value ?? ""
  )
    .trim()
    .toLocaleLowerCase(
      "tr-TR"
    );
}

/* =========================================================
   ADMIN FILTER
   ========================================================= */

function isAdminAllowedNotification(
  notification: NotificationItem
) {
  const title =
    normalizeText(
      notification.title
    );

  const message =
    normalizeText(
      notification.message
    );

  /*
   * Admin tarafında görmek istediğimiz
   * bildirim grupları:
   *
   * - PM yeni proje oluşturdu
   * - proje tamamlandı
   * - proje onaylanmadı / onay bekliyor
   * - toplu proje mesajı
   */

  const projectCreated =
    title.includes(
      "yeni proje"
    ) ||
    message.includes(
      "yeni proje oluştur"
    );

  const projectCompleted =
    title.includes(
      "proje tamam"
    ) ||
    message.includes(
      "proje tamamlandı"
    );

  const projectApproval =
    title.includes(
      "proje onay"
    ) ||
    message.includes(
      "onay verilmedi"
    ) ||
    message.includes(
      "onay bekli"
    );

  const groupMessage =
    title.includes(
      "toplu proje mesajı"
    ) ||
    title.includes(
      "proje mesajı"
    );

  return (
    projectCreated ||
    projectCompleted ||
    projectApproval ||
    groupMessage
  );
}

/* =========================================================
   VISUAL TYPE
   ========================================================= */

function getNotificationVisual(
  notification: NotificationItem
) {
  const title =
    normalizeText(
      notification.title
    );

  if (
    title.includes(
      "mesaj"
    )
  ) {
    return {
      icon:
        MessageSquareText,

      label:
        "Mesaj",

      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    };
  }

  if (
    title.includes(
      "tamam"
    )
  ) {
    return {
      icon:
        CheckCircle2,

      label:
        "Tamamlandı",

      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (
    title.includes(
      "onay"
    )
  ) {
    return {
      icon:
        Clock3,

      label:
        "Onay",

      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  if (
    title.includes(
      "proje"
    )
  ) {
    return {
      icon:
        FolderKanban,

      label:
        "Proje",

      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    };
  }

  return {
    icon:
      Bell,

    label:
      "Bildirim",

    iconClass:
      "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default function NotificationsPage() {
  const {
    isAdmin,
    loading:
      userLoading,
  } =
    useCurrentUser();

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

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

  const [
    forbidden,
    setForbidden,
  ] =
    useState(
      false
    );

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     LOAD
     ======================================================= */

  async function loadNotifications() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      setForbidden(
        false
      );

      const result =
        await getNotifications();

      setNotifications(
        result
      );
    } catch (
      error
    ) {
      if (
        error instanceof
        NotificationForbiddenError
      ) {
        setForbidden(
          true
        );

        return;
      }

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      } else {
        setError(
          "Bildirimler yüklenirken bir hata oluştu."
        );
      }
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(
    () => {
      if (
        !userLoading
      ) {
        loadNotifications();
      }
    },
    [
      userLoading,
    ]
  );

  /* =======================================================
     FILTER
     ======================================================= */

  const visibleNotifications =
    useMemo(
      () => {
        const source =
          isAdmin
            ? notifications.filter(
                isAdminAllowedNotification
              )
            : notifications;

        return [
          ...source,
        ].sort(
          (
            first,
            second
          ) => {
            const firstDate =
              new Date(
                first.createdAt ??
                  0
              ).getTime();

            const secondDate =
              new Date(
                second.createdAt ??
                  0
              ).getTime();

            return (
              secondDate -
              firstDate
            );
          }
        );
      },
      [
        notifications,
        isAdmin,
      ]
    );

  const unreadCount =
    visibleNotifications.filter(
      (
        notification
      ) =>
        notification.isRead ===
        false
    ).length;

  /* =======================================================
     READ
     ======================================================= */

  async function handleMarkAsRead(
    id: string
  ) {
    try {
      setUpdatingId(
        id
      );

      setError(
        ""
      );

      await markNotificationAsRead(
        id
      );

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              notification
            ) =>
              notification.id ===
              id
                ? {
                    ...notification,

                    isRead:
                      true,
                  }
                : notification
          )
      );
    } catch (
      error
    ) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading ||
    userLoading
  ) {
    return (
      <main className="min-h-screen px-6 py-8">

        <div className="mx-auto max-w-[1080px]">

          <div
            className="
              rounded-[22px]
              border
              border-gray-200
              bg-white
              p-16
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
                dark:border-t-white
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
              Bildirimler yükleniyor...
            </p>
          </div>

        </div>

      </main>
    );
  }

  /* =======================================================
     FORBIDDEN
     ======================================================= */

  if (
    forbidden
  ) {
    return (
      <main className="min-h-screen px-6 py-8">

        <div className="mx-auto max-w-[1080px]">

          <div
            className="
              rounded-[22px]
              border
              border-gray-200
              bg-white
              px-8
              py-16
              text-center

              dark:border-slate-800
              dark:bg-[#081321]
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
                rounded-2xl
                bg-gray-100
                text-gray-700

                dark:bg-slate-800
                dark:text-slate-200
              "
            >
              <LockKeyhole
                size={20}
              />
            </div>

            <h2
              className="
                mt-5
                text-[17px]
                font-bold
                text-gray-900

                dark:text-white
              "
            >
              Bildirimlere erişilemiyor
            </h2>

            <p
              className="
                mx-auto
                mt-2
                max-w-md
                text-[12px]
                leading-5
                text-gray-500

                dark:text-slate-400
              "
            >
              Bu kullanıcı hesabı için bildirimleri görüntüleme yetkisi bulunmuyor.
            </p>

          </div>

        </div>

      </main>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <main
      className="
        min-h-screen
        px-6
        py-8
        text-[#15161a]

        dark:text-white
      "
    >
      <div className="mx-auto max-w-[1080px]">

        {/* =================================================
            HEADER
            ================================================= */}

        <div
          className="
            mb-6
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div>

            <p
              className="
                mb-2
                text-[9px]
                font-bold
                uppercase
                tracking-[0.25em]
                text-gray-400

                dark:text-slate-500
              "
            >
              Bildirim Merkezi
            </p>

            <h1
              className="
                text-[31px]
                font-bold
                tracking-[-0.045em]
                text-gray-900

                dark:text-white
              "
            >
              Bildirimler
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
              {isAdmin
                ? "Projelerle ilgili yönetim bildirimlerini buradan takip edin."
                : "Proje ve görevlerinizle ilgili gelişmeleri buradan takip edin."}
            </p>

          </div>

          <button
            type="button"
            onClick={
              loadNotifications
            }
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              text-[11px]
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50

              dark:border-slate-700
              dark:bg-[#081321]
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            <RefreshCcw
              size={14}
            />

            Yenile
          </button>

        </div>

        {/* =================================================
            STATS
            ================================================= */}

        <div
          className="
            mb-4
            grid
            gap-3
            sm:grid-cols-2
          "
        >

          <div
            className="
              rounded-[20px]
              border
              border-gray-200
              bg-white
              px-5
              py-4

              dark:border-slate-800
              dark:bg-[#081321]
            "
          >
            <div className="flex items-center justify-between">

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
                  Toplam Bildirim
                </p>

                <p
                  className="
                    mt-2
                    text-[27px]
                    font-bold
                    tracking-[-0.04em]
                    text-gray-900

                    dark:text-white
                  "
                >
                  {
                    visibleNotifications.length
                  }
                </p>

              </div>

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-gray-50
                  text-gray-600

                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <Bell
                  size={18}
                />
              </div>

            </div>
          </div>

          <div
            className="
              rounded-[20px]
              border
              border-blue-200
              bg-blue-50/40
              px-5
              py-4

              dark:border-blue-500/25
              dark:bg-blue-500/5
            "
          >
            <div className="flex items-center justify-between">

              <div>

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-blue-500

                    dark:text-blue-300
                  "
                >
                  Okunmamış
                </p>

                <p
                  className="
                    mt-2
                    text-[27px]
                    font-bold
                    tracking-[-0.04em]
                    text-gray-900

                    dark:text-white
                  "
                >
                  {
                    unreadCount
                  }
                </p>

              </div>

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-100
                  text-blue-600

                  dark:bg-blue-500/10
                  dark:text-blue-300
                "
              >
                <BellRing
                  size={18}
                />
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className="
              mb-4
              rounded-[16px]
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-[11px]
              font-medium
              text-red-600

              dark:border-red-500/25
              dark:bg-red-500/5
              dark:text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* =================================================
            EMPTY
            ================================================= */}

        {visibleNotifications.length ===
        0 ? (
          <div
            className="
              rounded-[22px]
              border
              border-emerald-200
              bg-white
              px-8
              py-16
              text-center

              dark:border-emerald-500/25
              dark:bg-[#081321]
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
                rounded-2xl
                bg-emerald-50
                text-emerald-600

                dark:bg-emerald-500/10
                dark:text-emerald-300
              "
            >
              <CheckCircle2
                size={20}
              />
            </div>

            <h2
              className="
                mt-4
                text-[15px]
                font-bold
                text-gray-900

                dark:text-white
              "
            >
              Yeni bildiriminiz yok
            </h2>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-md
                text-[11px]
                leading-5
                text-gray-500

                dark:text-slate-400
              "
            >
              Yeni gelişmeler olduğunda bildirimler burada görüntülenecek.
            </p>

          </div>
        ) : (

          /* =================================================
             NOTIFICATION LIST
             ================================================= */

          <div className="space-y-2.5">

            {visibleNotifications.map(
              (
                notification
              ) => {
                const visual =
                  getNotificationVisual(
                    notification
                  );

                const Icon =
                  visual.icon;

                const unread =
                  notification.isRead ===
                  false;

                return (
                  <article
                    key={
                      notification.id
                    }
                    className={`
                      rounded-[19px]
                      border
                      px-5
                      py-4
                      transition-all
                      duration-200

                      ${
                        unread
                          ? `
                              border-blue-200
                              bg-blue-50/30
                              shadow-sm

                              dark:border-blue-500/25
                              dark:bg-blue-500/[0.04]
                            `
                          : `
                              border-gray-200
                              bg-white

                              dark:border-slate-800
                              dark:bg-[#081321]
                            `
                      }
                    `}
                  >

                    <div className="flex items-start gap-4">

                      {/* ICON */}

                      <div
                        className={`
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl

                          ${visual.iconClass}
                        `}
                      >
                        <Icon
                          size={17}
                          strokeWidth={
                            1.9
                          }
                        />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div
                          className="
                            flex
                            flex-col
                            gap-2
                            sm:flex-row
                            sm:items-start
                            sm:justify-between
                          "
                        >

                          <div className="min-w-0">

                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >

                              <h2
                                className="
                                  text-[13px]
                                  font-bold
                                  text-gray-900

                                  dark:text-white
                                "
                              >
                                {notification.title ||
                                  "Bildirim"}
                              </h2>

                              <span
                                className="
                                  rounded-md
                                  bg-gray-100
                                  px-2
                                  py-1
                                  text-[8px]
                                  font-bold
                                  uppercase
                                  tracking-[0.08em]
                                  text-gray-500

                                  dark:bg-slate-800
                                  dark:text-slate-400
                                "
                              >
                                {
                                  visual.label
                                }
                              </span>

                              {unread && (
                                <span
                                  className="
                                    rounded-md
                                    bg-blue-600
                                    px-2
                                    py-1
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-[0.08em]
                                    text-white
                                  "
                                >
                                  Yeni
                                </span>
                              )}

                            </div>

                            <p
                              className="
                                mt-2
                                whitespace-pre-line
                                text-[11px]
                                font-medium
                                leading-[1.65]
                                text-gray-500

                                dark:text-slate-400
                              "
                            >
                              {notification.message ||
                                "Bildirim içeriği bulunmuyor."}
                            </p>

                          </div>

                          <p
                            className="
                              shrink-0
                              text-[9px]
                              font-medium
                              text-gray-400

                              dark:text-slate-500
                            "
                          >
                            {formatDate(
                              notification.createdAt
                            )}
                          </p>

                        </div>

                        {/* ACTION */}

                        {unread && (
                          <div
                            className="
                              mt-3
                              flex
                              justify-end
                              border-t
                              border-gray-100
                              pt-3

                              dark:border-slate-800
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkAsRead(
                                  notification.id
                                )
                              }
                              disabled={
                                updatingId ===
                                notification.id
                              }
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-gray-200
                                bg-white
                                px-3
                                py-2
                                text-[9px]
                                font-semibold
                                text-gray-600
                                transition
                                hover:bg-gray-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50

                                dark:border-slate-700
                                dark:bg-[#0d1a2b]
                                dark:text-slate-300
                                dark:hover:bg-slate-800
                              "
                            >

                              <Check
                                size={12}
                              />

                              {updatingId ===
                              notification.id
                                ? "Güncelleniyor..."
                                : "Okundu olarak işaretle"}

                            </button>
                          </div>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>
    </main>
  );
}