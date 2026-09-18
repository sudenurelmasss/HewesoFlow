"use client";

import {
  Building2,
  Check,
  ImagePlus,
  Palette,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAppearance } from "../../contexts/AppearanceContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { updateAppearance } from "../../services/appearanceService";

export default function AppearancePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const {
    appearance,
    setAppearance,
  } = useAppearance();

  const {
    loading: userLoading,
    isAdmin,
  } = useCurrentUser();

  const [
    companyName,
    setCompanyName,
  ] = useState(
    appearance.companyName
  );

  const [
    logoDataUrl,
    setLogoDataUrl,
  ] = useState<
    string | null
  >(
    appearance.logoDataUrl ??
      null
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    setCompanyName(
      appearance.companyName
    );

    setLogoDataUrl(
      appearance.logoDataUrl ??
        null
    );
  }, [appearance]);

  useEffect(() => {
    if (
      !userLoading &&
      !isAdmin
    ) {
      router.replace("/");
    }
  }, [
    userLoading,
    isAdmin,
    router,
  ]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function handleLogoSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    clearMessages();

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Logo PNG, JPG veya WEBP formatında olmalıdır."
      );

      return;
    }

    const maxSize =
      2 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      setError(
        "Logo boyutu en fazla 2 MB olabilir."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setLogoDataUrl(
          reader.result
        );
      }
    };

    reader.readAsDataURL(
      file
    );
  }

  function removeLogo() {
    clearMessages();
    setLogoDataUrl(null);
  }

  function resetForm() {
    clearMessages();

    setCompanyName(
      appearance.companyName
    );

    setLogoDataUrl(
      appearance.logoDataUrl ??
        null
    );
  }

  async function handleSave() {
    clearMessages();

    const name =
      companyName.trim();

    if (!name) {
      setError(
        "Şirket adı boş bırakılamaz."
      );

      return;
    }

    try {
      setSaving(true);

      const result =
        await updateAppearance(
          {
            companyName:
              name,
            logoDataUrl,
          }
        );

      setAppearance(
        result
      );

      setMessage(
        "Görünüm ayarları kaydedildi."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Görünüm ayarları kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCcw
          size={20}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10 pt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Palette
            size={20}
            className="text-black"
          />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Görünüm
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Şirket adını ve logoyu buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Marka ayarları
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Şirket adı uygulamanın menüsünde, giriş ekranında ve tarayıcı sekmesinde kullanılır.
          </p>

          <div className="mt-7 space-y-7">
            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Şirket adı
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="companyName"
                  value={
                    companyName
                  }
                  onChange={(
                    event
                  ) =>
                    setCompanyName(
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Program adı sabit olarak{" "}
                <strong className="text-black">
                  Flow
                </strong>{" "}
                kalır.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                Şirket logosu
              </p>

              <p className="mt-1 text-xs text-slate-500">
                İsteğe bağlıdır.
              </p>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleLogoSelect
                }
                className="hidden"
              />

              <div className="mt-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                {logoDataUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="flex min-h-[260px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
                      <img
                        src={
                          logoDataUrl
                        }
                        alt="Şirket logosu"
                        className="max-h-[220px] max-w-[85%] object-contain"
                      />
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#202020]"
                      >
                        <Upload
                          size={16}
                        />

                        Değiştir
                      </button>

                      <button
                        type="button"
                        onClick={
                          removeLogo
                        }
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Trash2
                          size={16}
                        />

                        Kaldır
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex min-h-[220px] w-full flex-col items-center justify-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <ImagePlus
                        size={22}
                        className="text-black"
                      />
                    </div>

                    <span className="mt-3 text-sm font-medium text-black">
                      Logo seç
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      PNG, JPG veya WEBP · Maksimum 2 MB
                    </span>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <Check
                  size={17}
                  className="text-black"
                />

                {message}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={
                  resetForm
                }
                disabled={
                  saving
                }
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-[#202020] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCcw
                      size={16}
                      className="animate-spin"
                    />

                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check
                      size={16}
                    />

                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Önizleme
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Kullanıcıların göreceği marka görünümü.
          </p>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {logoDataUrl && (
              <div className="mb-6 flex min-h-[220px] items-center justify-center rounded-2xl bg-white p-5">
                <img
                  src={
                    logoDataUrl
                  }
                  alt="Logo önizleme"
                  className="max-h-[190px] max-w-[90%] object-contain"
                />
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-xl font-semibold tracking-[-0.03em] text-slate-900">
                {companyName.trim() ||
                  "Şirket"}
                <span className="text-black">
                  Flow
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Tarayıcı başlığı
            </p>

            <p className="mt-2 text-sm font-medium text-black">
              {companyName.trim() ||
                "Şirket"}
              Flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}