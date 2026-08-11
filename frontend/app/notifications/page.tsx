"use client";

import { useEffect, useState } from "react";

import {
  getNotifications,
  markNotificationAsRead,
  NotificationForbiddenError,
  NotificationItem,
} from "@/services/notificationService";

function formatDate(value?: string | null) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const result = await getNotifications();

      setNotifications(result);
    } catch (error) {
      if (error instanceof NotificationForbiddenError) {
        setForbidden(true);
        return;
      }

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Bildirimler yüklenirken bir hata oluştu."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => notification.isRead === false
  ).length;

  async function handleMarkAsRead(id: string) {
    try {
      setUpdatingId(id);

      await markNotificationAsRead(id);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8 text-[#17181c]">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            HewesoFlow
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Bildirimler
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Proje, görev ve ekip çalışmalarınızdaki son
            gelişmeleri takip edin.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Bildirimler yükleniyor...
            </p>
          </div>
        )}

        {!loading && forbidden && (
          <div className="rounded-3xl border border-gray-200 bg-white p-14 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              🔒
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Bildirimlere erişilemiyor
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Bu hesap için bildirimleri görüntüleme yetkisi
              bulunmuyor.
            </p>

            <a
              href="/"
              className="mt-7 inline-block rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Dashboard'a Dön
            </a>

          </div>
        )}

        {!loading && !forbidden && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8">

            <p className="font-medium text-red-600">
              Bildirimler yüklenemedi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadNotifications}
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
              <div className="mb-6 grid gap-4 md:grid-cols-2">

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Toplam Bildirim
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {notifications.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Okunmamış
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {unreadCount}
                  </p>
                </div>

              </div>

              {notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">

                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                    🔔
                  </div>

                  <h2 className="text-lg font-semibold">
                    Henüz bildiriminiz bulunmuyor
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Yeni görev, proje veya ekip gelişmeleri
                    burada görüntülenecek.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`rounded-3xl border bg-white p-6 transition ${
                        notification.isRead === false
                          ? "border-gray-300 shadow-sm"
                          : "border-gray-200"
                      }`}
                    >

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100">
                          🔔
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div>
                              <h2 className="font-semibold">
                                {notification.title ||
                                  "HewesoFlow Bildirimi"}
                              </h2>

                              <p className="mt-2 text-sm leading-6 text-gray-500">
                                {notification.message ||
                                  "Bildirim açıklaması bulunmuyor."}
                              </p>
                            </div>

                            {notification.isRead === false && (
                              <span className="w-fit rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                                Yeni
                              </span>
                            )}

                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">

                            <p className="text-xs text-gray-400">
                              {formatDate(
                                notification.createdAt
                              )}
                            </p>

                            {notification.isRead === false && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(
                                    notification.id
                                  )
                                }
                                disabled={
                                  updatingId ===
                                  notification.id
                                }
                                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50"
                              >
                                {updatingId ===
                                notification.id
                                  ? "Güncelleniyor..."
                                  : "Okundu olarak işaretle"}
                              </button>
                            )}

                          </div>

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