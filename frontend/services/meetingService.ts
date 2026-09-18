import {
  getStoredToken,
} from "./authService";

export type MeetingScopeType =
  1 | 2;

export interface MeetingItem {
  id: string;

  title: string;

  description?:
    | string
    | null;

  startDateTime: string;

  endDateTime: string;

  scopeType:
    MeetingScopeType;

  audienceLabel: string;

  roomName: string;

  createdByUserId: string;

  createdByUserName: string;

  projectId?:
    | string
    | null;

  projectName?:
    | string
    | null;

  participantCount: number;

  canJoin: boolean;

  createdAt: string;
}

export interface CreateMeetingRequest {
  title: string;

  description?:
    | string
    | null;

  startDateTime: string;

  endDateTime: string;

  scopeType:
    MeetingScopeType;

  departmentIds: string[];

  projectId?:
    | string
    | null;
}

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5063";

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

    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}

async function readError(
  response: Response
) {
  try {
    const data =
      await response.json();

    return (
      data?.message ||
      data?.title ||
      "İşlem başarısız oldu."
    );
  } catch {
    return (
      `İşlem başarısız. ` +
      `Hata kodu: ${response.status}`
    );
  }
}

export async function getMeetings():
  Promise<MeetingItem[]> {
  const response =
    await fetch(
      `${API_URL}/api/Meetings`,
      {
        method:
          "GET",

        headers:
          getHeaders(),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      await readError(
        response)
    );
  }

  return response.json();
}

export async function getMeetingById(
  id: string
): Promise<MeetingItem> {
  const response =
    await fetch(
      `${API_URL}/api/Meetings/${id}`,
      {
        method:
          "GET",

        headers:
          getHeaders(),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      await readError(
        response)
    );
  }

  return response.json();
}

export async function createMeeting(
  request:
    CreateMeetingRequest
): Promise<MeetingItem> {
  const response =
    await fetch(
      `${API_URL}/api/Meetings`,
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify(
            request),
      }
    );

  if (!response.ok) {
    throw new Error(
      await readError(
        response)
    );
  }

  return response.json();
}