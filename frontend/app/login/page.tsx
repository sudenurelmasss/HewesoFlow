"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAppearance } from "../../contexts/AppearanceContext";
import { authService } from "../../services/authService";

type PublicDepartment = {
  id: string;
  name: string;
};

type RawDepartment = {
  id?: unknown;
  name?: unknown;
  isActive?: unknown;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

export default function LoginPage() {
  const router = useRouter();

  const { appearance } = useAppearance();

  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    departmentId,
    setDepartmentId,
  ] = useState("");

  const [
    departments,
    setDepartments,
  ] = useState<PublicDepartment[]>([]);

  const [
    departmentsLoading,
    setDepartmentsLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadDepartments() {
      try {
        setDepartmentsLoading(true);

        const response = await fetch(
          `${API_URL}/api/Departments`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setDepartments([]);
          return;
        }

        const result: unknown =
          await response.json();

        let rawList: unknown[] = [];

        if (Array.isArray(result)) {
          rawList = result;
        } else if (
          result &&
          typeof result === "object" &&
          "data" in result
        ) {
          const data = (
            result as {
              data?: unknown;
            }
          ).data;

          if (Array.isArray(data)) {
            rawList = data;
          }
        }

        const normalized: PublicDepartment[] =
          rawList.reduce<
            PublicDepartment[]
          >((accumulator, current) => {
            if (
              !current ||
              typeof current !== "object"
            ) {
              return accumulator;
            }

            const item =
              current as RawDepartment;

            if (
              typeof item.id !==
                "string" ||
              typeof item.name !==
                "string"
            ) {
              return accumulator;
            }

            if (
              item.isActive === false
            ) {
              return accumulator;
            }

            const id = item.id.trim();
            const name =
              item.name.trim();

            if (!id || !name) {
              return accumulator;
            }

            accumulator.push({
              id,
              name,
            });

            return accumulator;
          }, []);

        setDepartments(
          normalized
        );
      } catch {
        setDepartments([]);
      } finally {
        setDepartmentsLoading(
          false
        );
      }
    }

    void loadDepartments();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function switchMode(
    newMode:
      | "login"
      | "register"
  ) {
    setMode(newMode);
    setPassword("");
    setConfirmPassword("");
    clearMessages();
  }

  function validateRegister():
    | string
    | null {
    if (!firstName.trim()) {
      return "Ad alanını doldurun.";
    }

    if (!lastName.trim()) {
      return "Soyad alanını doldurun.";
    }

    if (!email.trim()) {
      return "E-posta alanını doldurun.";
    }

    if (!departmentId) {
      return "Departmanınızı seçin.";
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

    if (
      password !==
      confirmPassword
    ) {
      return "Şifreler eşleşmiyor.";
    }

    return null;
  }

  async function handleLogin() {
    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "E-posta ve şifrenizi girin."
      );

      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result =
        await authService.login({
          email: email.trim(),
          password,
        });

      if (
        !result?.isSuccess ||
        !result?.data
      ) {
        setError(
          result?.message ||
            "E-posta veya şifre hatalı."
        );

        return;
      }

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
    const validationError =
      validateRegister();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result =
        await authService.register({
          firstName:
            firstName.trim(),
          lastName:
            lastName.trim(),
          email:
            email.trim(),
          password,
          departmentId,
        });

      setSuccess(
        result?.message ||
          "Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz."
      );

      setMode("login");

      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
      setDepartmentId("");
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
      return;
    }

    await handleRegister();
  }

  const companyName =
    appearance.companyName?.trim() ||
    "Heweso";

  const brandName =
    `${companyName}Flow`;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="relative z-10 w-full max-w-[470px]">
        {appearance.logoDataUrl && (
          <div className="mb-5 flex justify-center">
            <div className="flex min-h-[125px] min-w-[125px] items-center justify-center rounded-[28px] border border-white/80 bg-white/90 px-5 py-5 shadow-sm backdrop-blur">
              <img
                src={
                  appearance.logoDataUrl
                }
                alt={`${companyName} logosu`}
                className="max-h-[110px] max-w-[240px] object-contain"
              />
            </div>
          </div>
        )}

        <div className="mb-6 text-center">
          <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-black">
            {companyName}
            <span className="text-black">
              Flow
            </span>
          </h1>
        </div>

        <div className="rounded-[30px] border border-white bg-white/95 p-7 shadow-[0_24px_70px_rgba(30,50,60,0.10)] backdrop-blur sm:p-9">
          <div className="mb-8 grid grid-cols-2 rounded-2xl bg-[#f3f5f6] p-1">
            <button
              type="button"
              onClick={() =>
                switchMode(
                  "login"
                )
              }
              disabled={
                loading
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-black text-white shadow-sm"
                  : "text-[#939a9f] hover:text-black"
              }`}
            >
              Giriş Yap
            </button>

            <button
              type="button"
              onClick={() =>
                switchMode(
                  "register"
                )
              }
              disabled={
                loading
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-black text-white shadow-sm"
                  : "text-[#939a9f] hover:text-black"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-black">
              {mode === "login"
                ? "Tekrar hoş geldiniz"
                : `${brandName}'a katılın`}
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#22272a]">
              {mode === "login"
                ? "Hesabınıza giriş yapın"
                : "Yeni hesap oluşturun"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#929aa0]">
              {mode === "login"
                ? `${brandName} çalışma alanınıza devam etmek için bilgilerinizi girin.`
                : "Hesabınızı oluşturun. Yetkiniz sistem yöneticisi tarafından belirlenir."}
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={
              handleSubmit
            }
          >
            {mode ===
              "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-[#555f64]"
                  >
                    Ad
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4abad]"
                    />

                    <input
                      id="firstName"
                      value={
                        firstName
                      }
                      onChange={(
                        event
                      ) =>
                        setFirstName(
                          event.target.value
                        )
                      }
                      placeholder="Adınız"
                      required
                      disabled={
                        loading
                      }
                      className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-[#555f64]"
                  >
                    Soyad
                  </label>

                  <input
                    id="lastName"
                    value={
                      lastName
                    }
                    onChange={(
                      event
                    ) =>
                      setLastName(
                        event.target.value
                      )
                    }
                    placeholder="Soyadınız"
                    required
                    disabled={
                      loading
                    }
                    className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] px-4 py-3.5 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>
              </div>
            )}

            {mode ===
              "register" && (
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium text-[#555f64]"
                >
                  Departman
                </label>

                <select
                  id="department"
                  value={
                    departmentId
                  }
                  onChange={(
                    event
                  ) =>
                    setDepartmentId(
                      event.target.value
                    )
                  }
                  required
                  disabled={
                    loading ||
                    departmentsLoading
                  }
                  className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] px-4 py-3.5 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                >
                  <option value="">
                    {departmentsLoading
                      ? "Departmanlar yükleniyor..."
                      : "Departman seçin"}
                  </option>

                  {departments.map(
                    (
                      department
                    ) => (
                      <option
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#555f64]"
              >
                E-posta
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4abad]"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="ornek@sirket.com"
                  required
                  disabled={
                    loading
                  }
                  className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#555f64]"
              >
                Şifre
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4abad]"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Şifrenizi girin"
                  required
                  disabled={
                    loading
                  }
                  className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a4abad] hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>
              </div>
            </div>

            {mode ===
              "register" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#555f64]"
                >
                  Şifre tekrar
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4abad]"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Şifrenizi tekrar girin"
                    required
                    disabled={
                      loading
                    }
                    className="w-full rounded-2xl border border-[#e5e9ea] bg-[#fafbfb] py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a4abad] hover:text-black"
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? mode ===
                  "login"
                  ? "Giriş yapılıyor..."
                  : "Hesap oluşturuluyor..."
                : mode ===
                  "login"
                  ? "Giriş yap"
                  : "Kayıt ol"}

              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}