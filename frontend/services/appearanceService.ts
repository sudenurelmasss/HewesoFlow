import { getStoredToken } from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063";

const STORAGE_KEY = "flow_appearance";

export type AppearanceSetting = {
  companyName: string;
  productName: string;
  logoDataUrl: string | null;
  fullBrandName: string;
};

export type UpdateAppearanceSetting = {
  companyName: string;
  logoDataUrl?: string | null;
};

export const DEFAULT_APPEARANCE: AppearanceSetting = {
  companyName: "Heweso",
  productName: "Flow",
  logoDataUrl: null,
  fullBrandName: "HewesoFlow",
};

function normalizeAppearance(
  value: Partial<AppearanceSetting> | null | undefined
): AppearanceSetting {
  const companyName =
    typeof value?.companyName === "string" &&
    value.companyName.trim()
      ? value.companyName.trim()
      : DEFAULT_APPEARANCE.companyName;

  const logoDataUrl =
    typeof value?.logoDataUrl === "string" &&
    value.logoDataUrl.trim()
      ? value.logoDataUrl
      : null;

  return {
    companyName,
    productName: "Flow",
    logoDataUrl,
    fullBrandName: `${companyName}Flow`,
  };
}

function readLocalAppearance(): AppearanceSetting | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return normalizeAppearance(
      JSON.parse(raw) as Partial<AppearanceSetting>
    );
  } catch {
    return null;
  }
}

function saveLocalAppearance(
  appearance: AppearanceSetting
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appearance)
  );
}

export function getLocalAppearance(): AppearanceSetting {
  return readLocalAppearance() ?? DEFAULT_APPEARANCE;
}

export async function getAppearance(): Promise<AppearanceSetting> {
  const localAppearance = readLocalAppearance();

  try {
    const response = await fetch(
      `${API_URL}/api/Appearance`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return localAppearance ?? DEFAULT_APPEARANCE;
    }

    const result =
      (await response.json()) as Partial<AppearanceSetting>;

    const normalized = normalizeAppearance(result);

    saveLocalAppearance(normalized);

    return normalized;
  } catch {
    return localAppearance ?? DEFAULT_APPEARANCE;
  }
}

export async function updateAppearance(
  input: UpdateAppearanceSetting
): Promise<AppearanceSetting> {
  const companyName = input.companyName.trim();

  if (!companyName) {
    throw new Error("Şirket adı boş bırakılamaz.");
  }

  const normalized: AppearanceSetting = {
    companyName,
    productName: "Flow",
    logoDataUrl: input.logoDataUrl ?? null,
    fullBrandName: `${companyName}Flow`,
  };

  /*
   * Önce tarayıcıya kaydediyoruz.
   * Böylece API'de problem olsa bile görünüm özelliği çalışmaya devam eder.
   */
  saveLocalAppearance(normalized);

  const token = getStoredToken();

  /*
   * Token yoksa local kayıt yine kullanılabilir.
   */
  if (!token) {
    return normalized;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/Appearance`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName,
          logoDataUrl: input.logoDataUrl ?? null,
        }),
      }
    );

    /*
     * Backend henüz hazır değilse kullanıcıyı
     * "kaydedilemedi" hatasında bırakmıyoruz.
     */
    if (!response.ok) {
      console.warn(
        `Appearance API ${response.status} döndürdü. Yerel görünüm kullanılacak.`
      );

      return normalized;
    }

    const result =
      (await response.json()) as Partial<AppearanceSetting>;

    const serverAppearance =
      normalizeAppearance(result);

    saveLocalAppearance(serverAppearance);

    return serverAppearance;
  } catch (error) {
    console.warn(
      "Appearance API erişilemedi. Yerel görünüm kullanılacak.",
      error
    );

    return normalized;
  }
}