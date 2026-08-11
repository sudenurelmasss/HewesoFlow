"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function switchMode(newMode: "login" | "register") {
    setMode(newMode);
    setPassword("");
    setConfirmPassword("");
    clearMessages();
  }

  function validateRegister(): string | null {
    if (!firstName.trim()) {
      return "Ad alanını doldurun.";
    }

    if (!lastName.trim()) {
      return "Soyad alanını doldurun.";
    }

    if (!email.trim()) {
      return "E-posta alanını doldurun.";
    }

    if (password.length < 8) {
      return "Şifre en az 8 karakter olmalıdır.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Şifre en az bir büyük harf içermelidir.";
    }

    if (!/[a-z]/.test(password)) {
      return "Şifre en az bir küçük harf içermelidir.";
    }

    if (!/[0-9]/.test(password)) {
      return "Şifre en az bir rakam içermelidir.";
    }

    if (password !== confirmPassword) {
      return "Şifreler eşleşmiyor.";
    }

    return null;
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("E-posta ve şifrenizi girin.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result = await authService.login({
        email: email.trim(),
        password,
      });

      if (!result.isSuccess || !result.data) {
        setError(
          result.message || "E-posta veya şifre hatalı."
        );
        return;
      }

      const user = result.data;

      sessionStorage.setItem(
        "heweso_token",
        user.token
      );

      sessionStorage.setItem(
        "heweso_user",
        JSON.stringify({
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
          tokenExpiration: user.tokenExpiration,
        })
      );

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Giriş sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    const validationError = validateRegister();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        department: null,
      });

      if (!result.isSuccess) {
        setError(
          result.message || "Hesap oluşturulamadı."
        );
        return;
      }

      setSuccess(
        "Hesabınız başarıyla oluşturuldu. Giriş ekranına yönlendiriliyorsunuz."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kayıt sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (mode === "login") {
      await handleLogin();
    } else {
      await handleRegister();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] px-6 py-10">
      <div className="w-full max-w-[430px]">

        {/* LOGO */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#7c5cff] shadow-[0_12px_30px_rgba(124,92,255,0.25)]">
            <span className="text-xl font-bold text-white">
              H
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#22222a]">
            HewesoFlow
          </h1>

          <p className="mt-2 text-sm text-[#9999a3]">
            İşlerinizi tek bir yerde yönetin.
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-[32px] border border-[#eeeef3] bg-white p-8 shadow-[0_20px_60px_rgba(28,28,40,0.06)]">

          {/* TABS */}
          <div className="mb-8 flex rounded-2xl bg-[#f5f4fa] p-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-[#22222a] shadow-sm"
                  : "text-[#9999a3]"
              }`}
            >
              Giriş Yap
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-white text-[#22222a] shadow-sm"
                  : "text-[#9999a3]"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-[#7c5cff]">
              {mode === "login"
                ? "Tekrar hoş geldiniz"
                : "HewesoFlow'a katılın"}
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#22222a]">
              {mode === "login"
                ? "Hesabınıza giriş yapın"
                : "Yeni hesap oluşturun"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#92929d]">
              {mode === "login"
                ? "HewesoFlow çalışma alanınıza devam etmek için bilgilerinizi girin."
                : "Hesabınızı oluşturun. Yetkiniz sistem yöneticisi tarafından belirlenir."}
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit}
          >
            {/* AD / SOYAD */}
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-[#555560]"
                  >
                    Ad
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                    />

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(e.target.value)
                      }
                      placeholder="Adınız"
                      autoComplete="given-name"
                      maxLength={50}
                      required
                      disabled={loading}
                      className="w-full rounded-2xl border border-[#e9e9ef] bg-[#fbfbfd] py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-[#bfb2ff] focus:bg-white focus:ring-4 focus:ring-[#7c5cff]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-[#555560]"
                  >
                    Soyad
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    placeholder="Soyadınız"
                    autoComplete="family-name"
                    maxLength={50}
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#e9e9ef] bg-[#fbfbfd] px-4 py-3.5 text-sm outline-none transition focus:border-[#bfb2ff] focus:bg-white focus:ring-4 focus:ring-[#7c5cff]/10"
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#555560]"
              >
                E-posta
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  placeholder="ornek@heweso.com"
                  required
                  maxLength={150}
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#e9e9ef] bg-[#fbfbfd] py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-[#bfb2ff] focus:bg-white focus:ring-4 focus:ring-[#7c5cff]/10"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#555560]"
                >
                  Şifre
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#7c5cff]"
                  >
                    Şifremi unuttum
                  </button>
                )}
              </div>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                />

                <input
                  id="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder="Şifrenizi girin"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#e9e9ef] bg-[#fbfbfd] py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-[#bfb2ff] focus:bg-white focus:ring-4 focus:ring-[#7c5cff]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {mode === "register" && (
                <p className="mt-2 text-xs leading-5 text-[#9b9ba5]">
                  En az 8 karakter, bir büyük harf, bir
                  küçük harf ve bir rakam kullanın.
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            {mode === "register" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#555560]"
                >
                  Şifre tekrar
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                    placeholder="Şifrenizi tekrar girin"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#e9e9ef] bg-[#fbfbfd] py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-[#bfb2ff] focus:bg-white focus:ring-4 focus:ring-[#7c5cff]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaaab4]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-sm text-green-700">
                  {success}
                </p>
              </div>
            )}

            {mode === "register" && (
              <div className="rounded-2xl bg-[#f7f6ff] px-4 py-3">
                <p className="text-xs leading-5 text-[#777783]">
                  Yeni hesaplar standart kullanıcı olarak
                  oluşturulur. Yönetici yetkileri yalnızca
                  sistem yöneticisi tarafından verilebilir.
                </p>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22222a] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? mode === "login"
                  ? "Giriş yapılıyor..."
                  : "Hesap oluşturuluyor..."
                : mode === "login"
                  ? "Giriş yap"
                  : "Hesap oluştur"}

              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#aaaab4]">
          © 2026 HewesoFlow
        </p>
      </div>
    </main>
  );
}