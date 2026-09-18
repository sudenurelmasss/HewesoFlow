"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AppearanceSetting,
  DEFAULT_APPEARANCE,
  getAppearance,
  getLocalAppearance,
} from "../services/appearanceService";

type AppearanceContextValue = {
  appearance: AppearanceSetting;
  loading: boolean;
  refreshAppearance: () => Promise<void>;
  setAppearance: (value: AppearanceSetting) => void;
};

const AppearanceContext =
  createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [appearance, setAppearanceState] =
    useState<AppearanceSetting>(DEFAULT_APPEARANCE);

  const [loading, setLoading] =
    useState(true);

  const setAppearance = useCallback(
    (value: AppearanceSetting) => {
      setAppearanceState(value);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "flow_appearance",
          JSON.stringify(value)
        );
      }
    },
    []
  );

  const refreshAppearance =
    useCallback(async () => {
      try {
        const result =
          await getAppearance();

        setAppearanceState(result);
      } catch {
        setAppearanceState(
          getLocalAppearance()
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    /*
     * Sayfa açıldığı anda local görünümü göster.
     * API cevabını beklerken Heweso'ya dönmesin.
     */
    const local =
      getLocalAppearance();

    setAppearanceState(local);

    void refreshAppearance();
  }, [refreshAppearance]);

  useEffect(() => {
    if (
      typeof document ===
      "undefined"
    ) {
      return;
    }

    const companyName =
      appearance.companyName?.trim();

    document.title =
      companyName
        ? `${companyName}Flow`
        : "Flow";
  }, [appearance.companyName]);

  const value =
    useMemo<AppearanceContextValue>(
      () => ({
        appearance,
        loading,
        refreshAppearance,
        setAppearance,
      }),
      [
        appearance,
        loading,
        refreshAppearance,
        setAppearance,
      ]
    );

  return (
    <AppearanceContext.Provider
      value={value}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance():
  AppearanceContextValue {
  const context =
    useContext(AppearanceContext);

  if (!context) {
    throw new Error(
      "useAppearance yalnızca AppearanceProvider içinde kullanılabilir."
    );
  }

  return context;
}