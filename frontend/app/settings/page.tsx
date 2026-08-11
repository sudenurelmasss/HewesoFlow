"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [taskNotifications, setTaskNotifications] =
    useState(true);

  const [projectNotifications, setProjectNotifications] =
    useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = localStorage.getItem(
      "heweso-settings"
    );

    if (!settings) {
      return;
    }

    try {
      const parsed = JSON.parse(settings);

      setEmailNotifications(
        parsed.emailNotifications ?? true
      );

      setTaskNotifications(
        parsed.taskNotifications ?? true
      );

      setProjectNotifications(
        parsed.projectNotifications ?? true
      );
    } catch {}
  }, []);

  function saveSettings() {
    localStorage.setItem(
      "heweso-settings",
      JSON.stringify({
        emailNotifications,
        taskNotifications,
        projectNotifications,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            HewesoFlow
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Ayarlar
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Uygulama tercihlerinizi yönetin.
          </p>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-7">

          <h2 className="text-lg font-semibold">
            Bildirim Tercihleri
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Hangi konularda bildirim almak istediğinizi
            belirleyin.
          </p>

          <div className="mt-7 divide-y divide-gray-100">

            <SettingRow
              title="E-posta Bildirimleri"
              description="Önemli gelişmeler için e-posta bildirimi."
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />

            <SettingRow
              title="Görev Bildirimleri"
              description="Görev atamaları ve durum değişiklikleri."
              checked={taskNotifications}
              onChange={setTaskNotifications}
            />

            <SettingRow
              title="Proje Bildirimleri"
              description="Proje üyeliği ve proje güncellemeleri."
              checked={projectNotifications}
              onChange={setProjectNotifications}
            />

          </div>

          <div className="mt-7 flex items-center justify-end gap-4">

            {saved && (
              <span className="text-sm text-gray-500">
                Ayarlar kaydedildi.
              </span>
            )}

            <button
              onClick={saveSettings}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white"
            >
              Değişiklikleri Kaydet
            </button>

          </div>

        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-7">

          <h2 className="text-lg font-semibold">
            Hesap
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Oturum ve kullanıcı ayarları.
          </p>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("user");

              window.location.href = "/login";
            }}
            className="mt-6 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-medium hover:bg-gray-50"
          >
            Oturumu Kapat
          </button>

        </section>

      </div>
    </main>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">

      <div>
        <p className="font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked
            ? "bg-black"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}