"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  tokenExpiration?: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("heweso_user");

    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(
        storedUser
      ) as CurrentUser;

      setUser(parsedUser);
    } catch {
      sessionStorage.removeItem("heweso_user");
      sessionStorage.removeItem("heweso_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin =
    user?.roles?.includes("Admin") ?? false;

  const isProjectManager =
    user?.roles?.includes("ProjectManager") ?? false;

  const isTeamMember =
    user?.roles?.includes("TeamMember") ?? false;

  const canManageProjects =
    isAdmin || isProjectManager;

  return {
    user,
    loading,
    isAdmin,
    isProjectManager,
    isTeamMember,
    canManageProjects,
  };
}