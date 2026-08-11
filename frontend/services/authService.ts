const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department?: string | null;
}

export interface AuthData {
  token?: string;
  accessToken?: string;
  jwtToken?: string;

  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;

  [key: string]: unknown;
}

export interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

function extractToken(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as Record<string, unknown>;

  if (typeof response.token === "string") {
    return response.token;
  }

  if (typeof response.accessToken === "string") {
    return response.accessToken;
  }

  if (typeof response.jwtToken === "string") {
    return response.jwtToken;
  }

  if (
    response.data &&
    typeof response.data === "object"
  ) {
    const data = response.data as Record<string, unknown>;

    if (typeof data.token === "string") {
      return data.token;
    }

    if (typeof data.accessToken === "string") {
      return data.accessToken;
    }

    if (typeof data.jwtToken === "string") {
      return data.jwtToken;
    }
  }

  return null;
}

function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("accessToken", token);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

/*
  İKİ KULLANIMI DA DESTEKLER:

  login("mail@heweso.com", "Test1234")

  veya

  login({
    email: "mail@heweso.com",
    password: "Test1234"
  })
*/
export async function login(
  emailOrRequest: string | LoginRequest,
  password?: string
): Promise<any> {
  let request: LoginRequest;

  if (typeof emailOrRequest === "string") {
    request = {
      email: emailOrRequest.trim(),
      password: password ?? "",
    };
  } else {
    request = {
      email: emailOrRequest.email.trim(),
      password: emailOrRequest.password,
    };
  }

  console.log("Login isteği gönderiliyor:", {
    email: request.email,
    passwordLength: request.password.length,
  });

  const response = await fetch(`${API_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: request.email,
      password: request.password,
    }),
  });

  const result = await response.json().catch(() => null);

  console.log("Login API response:", result);

  if (!response.ok) {
    const message =
      result?.message ||
      result?.title ||
      "E-posta veya şifre hatalı.";

    throw new Error(message);
  }

  const token = extractToken(result);

  if (!token) {
    console.error(
      "Backend başarılı cevap verdi fakat token bulunamadı:",
      result
    );

    throw new Error(
      "Giriş başarılı ancak JWT token alınamadı."
    );
  }

  saveToken(token);

  /*
    Backend kullanıcı bilgilerini data içinde dönüyorsa
    localStorage'a da kaydediyoruz.
  */
  if (
    typeof window !== "undefined" &&
    result?.data &&
    typeof result.data === "object"
  ) {
    localStorage.setItem(
      "user",
      JSON.stringify(result.data)
    );
  }

  /*
    ÖNEMLİ:
    Eski login/page.tsx hangi response yapısını
    bekliyorsa onu bozmuyoruz.
  */
  return result;
}

export async function register(
  request: RegisterRequest
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/Auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        firstName: request.firstName.trim(),
        lastName: request.lastName.trim(),
        email: request.email.trim(),
        password: request.password,
        department: request.department ?? null,
      }),
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      result?.message ||
      result?.title ||
      "Kayıt oluşturulurken bir hata oluştu.";

    throw new Error(message);
  }

  return result;
}

export const authService = {
  login,
  register,
  logout,

  getToken: getStoredToken,

  getStoredToken,
};