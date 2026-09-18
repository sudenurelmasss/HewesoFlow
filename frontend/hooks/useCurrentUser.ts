"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

export type CurrentUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  tokenExpiration?: string;
};

export function useCurrentUser() {
  const pathname =
    usePathname();

  const [
    user,
    setUser,
  ] =
    useState<CurrentUser | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
   * Storage içerisindeki güncel
   * kullanıcıyı tekrar okur.
   */
  const readCurrentUser =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const storedUser =
        sessionStorage.getItem(
          "heweso_user"
        );

      if (!storedUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const parsedUser =
          JSON.parse(
            storedUser
          ) as CurrentUser;

        setUser(
          parsedUser
        );
      } catch {
        sessionStorage.removeItem(
          "heweso_user"
        );

        sessionStorage.removeItem(
          "heweso_token"
        );

        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "accessToken"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * İlk açılışta VE her sayfa
   * değişiminde kullanıcıyı yeniden oku.
   *
   * Örneğin:
   *
   * /login -> /
   *
   * geçişinde yeni giriş yapan
   * kullanıcının rolü hemen okunur.
   */
  useEffect(() => {
    readCurrentUser();
  }, [
    pathname,
    readCurrentUser,
  ]);

  /*
   * Aynı sekmede manuel olarak
   * kullanıcı değişikliği bildirildiğinde
   * tekrar oku.
   */
  useEffect(() => {
    function handleUserChanged() {
      readCurrentUser();
    }

    window.addEventListener(
      "heweso-user-changed",
      handleUserChanged
    );

    return () => {
      window.removeEventListener(
        "heweso-user-changed",
        handleUserChanged
      );
    };
  }, [
    readCurrentUser,
  ]);

  /*
   * Farklı sekmede oturum
   * değişirse onu da yakala.
   */
  useEffect(() => {
    function handleStorageChange(
      event: StorageEvent
    ) {
      if (
        event.key ===
          "heweso_user" ||
        event.key ===
          "user" ||
        event.key ===
          "heweso_token" ||
        event.key ===
          "token"
      ) {
        readCurrentUser();
      }
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [
    readCurrentUser,
  ]);

  const roles =
    user?.roles ?? [];

  const isAdmin =
    roles.includes(
      "Admin"
    );

  const isProjectManager =
    roles.includes(
      "ProjectManager"
    );

  const isTeamMember =
    roles.includes(
      "TeamMember"
    );

  const canManageProjects =
    isAdmin ||
    isProjectManager;

  return {
    user,
    loading,
    isAdmin,
    isProjectManager,
    isTeamMember,
    canManageProjects,
    refreshUser:
      readCurrentUser,
  };
}