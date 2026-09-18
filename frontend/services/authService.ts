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
  departmentId: string;
}

export interface AuthUserData {
  token?: string;
  accessToken?: string;
  jwtToken?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  tokenExpiration?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  isSuccess?: boolean;
  message?: string;
  data?: T;
}

function extractToken(
  result: unknown
): string | null {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const response =
    result as Record<
      string,
      unknown
    >;

  for (const key of [
    "token",
    "accessToken",
    "jwtToken",
  ]) {
    const value =
      response[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  if (
    response.data &&
    typeof response.data ===
      "object"
  ) {
    const data =
      response.data as Record<
        string,
        unknown
      >;

    for (const key of [
      "token",
      "accessToken",
      "jwtToken",
    ]) {
      const value =
        data[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }
  }

  return null;
}

function saveToken(
  token: string
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "token",
    token
  );

  localStorage.setItem(
    "accessToken",
    token
  );

  sessionStorage.setItem(
    "heweso_token",
    token
  );
}

export function getStoredToken():
  | string
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return (
    localStorage.getItem(
      "token"
    ) ||
    localStorage.getItem(
      "accessToken"
    ) ||
    sessionStorage.getItem(
      "heweso_token"
    )
  );
}

export function getStoredUser():
  | AuthUserData
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const localUser =
    localStorage.getItem(
      "user"
    );

  const sessionUser =
    sessionStorage.getItem(
      "heweso_user"
    );

  const raw =
    localUser ||
    sessionUser;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    ) as AuthUserData;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "user"
  );

  sessionStorage.removeItem(
    "heweso_token"
  );

  sessionStorage.removeItem(
    "heweso_user"
  );
}

export async function login(
  emailOrRequest:
    | string
    | LoginRequest,
  password?: string
): Promise<
  ApiResponse<AuthUserData>
> {
  const request: LoginRequest =
    typeof emailOrRequest ===
    "string"
      ? {
          email:
            emailOrRequest.trim(),
          password:
            password ?? "",
        }
      : {
          email:
            emailOrRequest.email.trim(),
          password:
            emailOrRequest.password,
        };

  const response =
    await fetch(
      `${API_URL}/api/Auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify(
          request
        ),
      }
    );

  const result =
    (await response
      .json()
      .catch(
        () => null
      )) as
      | ApiResponse<AuthUserData>
      | null;

  if (!response.ok) {
    throw new Error(
      result?.message ||
        "E-posta veya şifre hatalı."
    );
  }

  const token =
    extractToken(result);

  if (!token) {
    throw new Error(
      "Giriş başarılı ancak JWT token alınamadı."
    );
  }

  saveToken(token);

  if (
    typeof window !==
      "undefined" &&
    result?.data
  ) {
    localStorage.setItem(
      "user",
      JSON.stringify(
        result.data
      )
    );

    sessionStorage.setItem(
      "heweso_user",
      JSON.stringify(
        result.data
      )
    );
  }

  return (
    result ?? {
      isSuccess: true,
    }
  );
}

export async function register(
  request: RegisterRequest
): Promise<
  ApiResponse<AuthUserData>
> {
  const response =
    await fetch(
      `${API_URL}/api/Auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify({
          firstName:
            request.firstName.trim(),
          lastName:
            request.lastName.trim(),
          email:
            request.email.trim(),
          password:
            request.password,
          departmentId:
            request.departmentId,
        }),
      }
    );

  const result =
    (await response
      .json()
      .catch(
        () => null
      )) as
      | ApiResponse<AuthUserData>
      | null;

  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Kayıt oluşturulurken bir hata oluştu."
    );
  }

  return (
    result ?? {
      isSuccess: true,
    }
  );
}

export const authService = {
  login,
  register,
  logout,
  getToken:
    getStoredToken,
  getStoredToken,
  getStoredUser,
};