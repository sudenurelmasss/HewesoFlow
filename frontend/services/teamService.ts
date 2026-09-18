import {
  getStoredToken,
} from "./authService";

/* =========================================================
   TYPES
   ========================================================= */

export interface TeamMember {
  id: string;

  userId?: string | null;

  firstName?: string | null;

  lastName?: string | null;

  fullName?: string | null;

  email?: string | null;

  /*
   * Ekranda göstereceğimiz
   * normalize edilmiş tek rol.
   */
  role?: string | null;

  /*
   * Backend'den gelen gerçek roller.
   */
  roles?: string[];

  department?: string | null;

  departmentId?: string | null;

  isActive?: boolean;

  joinedAt?: string | null;

  createdAt?: string | null;
}

interface RawTeamMember {
  id?: string;

  userId?: string | null;

  firstName?: string | null;

  lastName?: string | null;

  fullName?: string | null;

  email?: string | null;

  role?: string | null;

  roles?: string[] | null;

  department?: string | null;

  departmentId?: string | null;

  isActive?: boolean;

  joinedAt?: string | null;

  createdAt?: string | null;

  /*
   * Eski endpointlerden gelirse
   * hata vermesin diye tutuluyor.
   */
  projectId?: string | null;

  projectName?: string | null;
}

interface ApiResponse<T> {
  isSuccess?: boolean;

  message?: string;

  data?: T;
}

/* =========================================================
   ERRORS
   ========================================================= */

export class ForbiddenError extends Error {
  constructor() {
    super(
      "FORBIDDEN"
    );

    this.name =
      "ForbiddenError";
  }
}

/* =========================================================
   API
   ========================================================= */

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

/* =========================================================
   HEADERS
   ========================================================= */

function getHeaders():
  HeadersInit {
  const token =
    getStoredToken();

  if (!token) {
    throw new Error(
      "Oturum bulunamadı."
    );
  }

  return {
    Accept:
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}

/* =========================================================
   ROLE NORMALIZATION
   ========================================================= */

function normalizeRoleName(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return value
    .replace(
      /\s+/g,
      ""
    )
    .toLocaleLowerCase(
      "tr-TR"
    );
}

/*
 * Bir kullanıcıda TeamMember +
 * ProjectManager rolleri birlikte
 * bulunabilir.
 *
 * Ekip ekranında en yüksek yetkili
 * rolü gösteriyoruz.
 */
function getPrimaryRole(
  member:
    RawTeamMember
) {
  const roles =
    Array.isArray(
      member.roles
    )
      ? member.roles
      : [];

  const allRoles = [
    ...roles,

    ...(
      member.role
        ? [
            member.role,
          ]
        : []
    ),
  ];

  const normalized =
    allRoles.map(
      normalizeRoleName
    );

  if (
    normalized.includes(
      "admin"
    )
  ) {
    return "Admin";
  }

  if (
    normalized.includes(
      "projectmanager"
    )
  ) {
    return "Project Manager";
  }

  if (
    normalized.includes(
      "teammember"
    )
  ) {
    return "Team Member";
  }

  /*
   * Kullanıcının henüz rol kaydı
   * oluşmamışsa sistem mantığımız
   * gereği varsayılan kullanıcı
   * Team Member kabul edilir.
   */
  return "Team Member";
}

/* =========================================================
   NORMALIZE USER
   ========================================================= */

function normalizeMember(
  member:
    RawTeamMember
): TeamMember {
  return {
    id:
      member.id ||
      member.userId ||
      "",

    userId:
      member.userId ||
      member.id ||
      null,

    firstName:
      member.firstName ??
      null,

    lastName:
      member.lastName ??
      null,

    fullName:
      member.fullName ??
      null,

    email:
      member.email ??
      null,

    role:
      getPrimaryRole(
        member
      ),

    roles:
      member.roles ??
      [],

    department:
      member.department ??
      null,

    departmentId:
      member.departmentId ??
      null,

    isActive:
      member.isActive !==
      false,

    joinedAt:
      member.joinedAt ??
      null,

    createdAt:
      member.createdAt ??
      null,
  };
}

/* =========================================================
   RESPONSE
   ========================================================= */

function unwrapList(
  result:
    | RawTeamMember[]
    | ApiResponse<
        RawTeamMember[]
      >
): TeamMember[] {
  let items:
    RawTeamMember[] =
    [];

  if (
    Array.isArray(
      result
    )
  ) {
    items =
      result;
  } else if (
    Array.isArray(
      result.data
    )
  ) {
    items =
      result.data;
  }

  return items.map(
    normalizeMember
  );
}

/* =========================================================
   GET TEAM
   ========================================================= */

export async function getTeamMembers():
  Promise<TeamMember[]> {
  /*
   * Öncelikle Users endpoint'i
   * kullanılır.
   *
   * Backend UserListDto artık Roles
   * listesini doğrudan döndürüyor.
   */
  const endpoints = [
    `${API_URL}/api/Users`,
    `${API_URL}/api/User`,
    `${API_URL}/api/Team`,
  ];

  for (
    const endpoint
    of endpoints
  ) {
    const response =
      await fetch(
        endpoint,
        {
          method:
            "GET",

          headers:
            getHeaders(),

          cache:
            "no-store",
        }
      );

    if (
      response.status ===
      404
    ) {
      continue;
    }

    if (
      response.status ===
      401
    ) {
      throw new Error(
        "Oturum süresi dolmuş olabilir."
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new ForbiddenError();
    }

    if (
      !response.ok
    ) {
      throw new Error(
        `Ekip bilgileri alınamadı. Hata kodu: ${response.status}`
      );
    }

    const result:
      | RawTeamMember[]
      | ApiResponse<
          RawTeamMember[]
        > =
      await response.json();

    return unwrapList(
      result
    );
  }

  return [];
}