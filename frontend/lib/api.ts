const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    throw new Error("Sunucudan geçersiz bir cevap alındı.");
  }

  if (!response.ok) {
    const possibleError = data as {
      message?: string;
    };

    throw new Error(
      possibleError.message ?? "İşlem sırasında bir hata oluştu."
    );
  }

  return data;
}