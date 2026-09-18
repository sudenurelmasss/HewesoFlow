"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  Plus,
  RefreshCw,
  Users,
  Video,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useCurrentUser,
} from "@/hooks/useCurrentUser";

import {
  Department,
  getDepartments,
} from "@/services/departmentService";

import {
  createMeeting,
  getMeetings,
  MeetingItem,
} from "@/services/meetingService";

import {
  getProjects,
  Project,
} from "@/services/projectService";

import {
  getCalendarTasks,
  TaskItem,
} from "@/services/taskService";

/* =========================================================
   CONSTANTS
   ========================================================= */

const months = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const weekdays = [
  "PZT",
  "SAL",
  "ÇAR",
  "PER",
  "CUM",
  "CMT",
  "PAZ",
];

/* =========================================================
   TYPES
   ========================================================= */

type CalendarEvent = {
  id: string;

  date: string;

  title: string;

  subtitle?: string;

  kind:
    | "project-start"
    | "project-end"
    | "task"
    | "meeting";

  href?: string;
};

/* =========================================================
   HELPERS
   ========================================================= */

function dateKey(
  value?:
    | string
    | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value.slice(
      0,
      10
    );
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getLocalDateValue(
  date:
    Date = new Date()
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getTimeValue(
  date: Date
) {
  return (
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    ) +
    ":" +
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    )
  );
}

function getFutureDate(
  hours: number
) {
  return new Date(
    Date.now() +
      hours *
        60 *
        60 *
        1000
  );
}

function localDateTimeToIso(
  date: string,
  time: string
) {
  return new Date(
    `${date}T${time}:00`
  ).toISOString();
}

/* =========================================================
   PAGE
   ========================================================= */

export default function CalendarPage() {
  const router =
    useRouter();

  const {
    user,
    isAdmin,
    isProjectManager,
  } =
    useCurrentUser();

  const now =
    new Date();

  /* =======================================================
     CALENDAR
     ======================================================= */

  const [
    year,
    setYear,
  ] =
    useState(
      now.getFullYear()
    );

  const [
    month,
    setMonth,
  ] =
    useState(
      now.getMonth()
    );

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>(
      []
    );

  const [
    tasks,
    setTasks,
  ] =
    useState<TaskItem[]>(
      []
    );

  const [
    meetings,
    setMeetings,
  ] =
    useState<MeetingItem[]>(
      []
    );

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     MEETING MODAL
     ======================================================= */

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    meetingError,
    setMeetingError,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const initialStart =
    getFutureDate(
      1
    );

  const initialEnd =
    getFutureDate(
      2
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      getLocalDateValue(
        initialStart
      )
    );

  const [
    startTime,
    setStartTime,
  ] =
    useState(
      getTimeValue(
        initialStart
      )
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      getLocalDateValue(
        initialEnd
      )
    );

  const [
    endTime,
    setEndTime,
  ] =
    useState(
      getTimeValue(
        initialEnd
      )
    );

  const [
    selectedDepartmentIds,
    setSelectedDepartmentIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] =
    useState("");

  /* =======================================================
     LOAD
     ======================================================= */

  async function load() {
    try {
      setLoading(
        true
      );

      setError("");

      const [
        projectResult,
        taskResult,
        meetingResult,
      ] =
        await Promise.all([
          getProjects(),
          getCalendarTasks(),
          getMeetings(),
        ]);

      setProjects(
        projectResult
      );

      setTasks(
        taskResult
      );

      setMeetings(
        meetingResult
      );

      if (isAdmin) {
        const departmentResult =
          await getDepartments();

        setDepartments(
          departmentResult
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Takvim verileri yüklenemedi."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(
    () => {
      if (!user) {
        return;
      }

      load();

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      user?.userId,
      isAdmin,
    ]
  );

  /* =======================================================
     PM PROJECTS
     ======================================================= */

  const managerProjects =
    useMemo(
      () => {
        if (!user) {
          return [];
        }

        return projects.filter(
          project =>
            project.projectManagerId ===
            user.userId
        );
      },
      [
        projects,
        user,
      ]
    );

  /* =======================================================
     EVENTS
     ======================================================= */

  const events =
    useMemo<
      CalendarEvent[]
    >(
      () => {
        const projectEvents =
          projects.flatMap(
            project => [
              ...(
                project.startDate
                  ? [
                      {
                        id:
                          `project-start-${project.id}`,

                        date:
                          dateKey(
                            project.startDate
                          ),

                        title:
                          project.name,

                        subtitle:
                          "Başlangıç",

                        kind:
                          "project-start" as const,

                        href:
                          `/projects/${project.id}`,
                      },
                    ]
                  : []
              ),

              ...(
                project.endDate
                  ? [
                      {
                        id:
                          `project-end-${project.id}`,

                        date:
                          dateKey(
                            project.endDate
                          ),

                        title:
                          project.name,

                        subtitle:
                          "Bitiş",

                        kind:
                          "project-end" as const,

                        href:
                          `/projects/${project.id}`,
                      },
                    ]
                  : []
              ),
            ]
          );

        const taskEvents =
          tasks
            .filter(
              task =>
                task.dueDate
            )
            .map(
              task => ({
                id:
                  `task-${task.id}`,

                date:
                  dateKey(
                    task.dueDate
                  ),

                title:
                  task.title,

                subtitle:
                  "Görev",

                kind:
                  "task" as const,

                href:
                  `/my-tasks/${task.id}`,
              })
            );

        const meetingEvents =
          meetings.map(
            meeting => ({
              id:
                `meeting-${meeting.id}`,

              date:
                dateKey(
                  meeting.startDateTime
                ),

              title:
                meeting.title,

              subtitle:
                new Date(
                  meeting.startDateTime
                ).toLocaleTimeString(
                  "tr-TR",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",
                  }
                ),

              kind:
                "meeting" as const,

              href:
                `/meetings/${meeting.id}`,
            })
          );

        return [
          ...projectEvents,
          ...taskEvents,
          ...meetingEvents,
        ];
      },
      [
        projects,
        tasks,
        meetings,
      ]
    );

  /* =======================================================
     DAYS
     ======================================================= */

  const cells =
    useMemo(
      () => {
        const first =
          new Date(
            year,
            month,
            1
          ).getDay();

        const leading =
          first === 0
            ? 6
            : first - 1;

        const totalDays =
          new Date(
            year,
            month + 1,
            0
          ).getDate();

        return [
          ...Array(
            leading
          ).fill(null),

          ...Array.from(
            {
              length:
                totalDays,
            },
            (
              _,
              index
            ) =>
              index + 1
          ),
        ];
      },
      [
        year,
        month,
      ]
    );

  /* =======================================================
     MONTH NAVIGATION
     ======================================================= */

  function moveMonth(
    delta: number
  ) {
    const date =
      new Date(
        year,
        month + delta,
        1
      );

    setYear(
      date.getFullYear()
    );

    setMonth(
      date.getMonth()
    );
  }

  /* =======================================================
     DEPARTMENT
     ======================================================= */

  function toggleDepartment(
    id: string
  ) {
    setSelectedDepartmentIds(
      current =>
        current.includes(
          id
        )
          ? current.filter(
              item =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );
  }

  /* =======================================================
     MODAL
     ======================================================= */

  function resetForm() {
    const start =
      getFutureDate(
        1
      );

    const end =
      getFutureDate(
        2
      );

    setTitle(
      ""
    );

    setDescription(
      ""
    );

    setStartDate(
      getLocalDateValue(
        start
      )
    );

    setStartTime(
      getTimeValue(
        start
      )
    );

    setEndDate(
      getLocalDateValue(
        end
      )
    );

    setEndTime(
      getTimeValue(
        end
      )
    );

    setSelectedDepartmentIds(
      []
    );

    setSelectedProjectId(
      ""
    );

    setMeetingError(
      ""
    );
  }

  function openModal() {
    resetForm();

    setModalOpen(
      true
    );
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(
      false
    );

    setMeetingError(
      ""
    );
  }

  /* =======================================================
     CREATE MEETING
     ======================================================= */

  async function submitMeeting(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMeetingError(
      ""
    );

    if (
      !title.trim()
    ) {
      setMeetingError(
        "Toplantı adı zorunludur."
      );

      return;
    }

    if (
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime
    ) {
      setMeetingError(
        "Başlangıç ve bitiş tarihi ile saati seçilmelidir."
      );

      return;
    }

    const start =
      new Date(
        `${startDate}T${startTime}:00`
      );

    const end =
      new Date(
        `${endDate}T${endTime}:00`
      );

    if (
      end <= start
    ) {
      setMeetingError(
        "Bitiş zamanı başlangıç zamanından sonra olmalıdır."
      );

      return;
    }

    if (
      isAdmin &&
      selectedDepartmentIds.length ===
        0
    ) {
      setMeetingError(
        "En az bir departman seçmelisiniz."
      );

      return;
    }

    if (
      !isAdmin &&
      isProjectManager &&
      !selectedProjectId
    ) {
      setMeetingError(
        "Bir proje seçmelisiniz."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      await createMeeting(
        {
          title:
            title.trim(),

          description:
            description.trim() ||
            null,

          startDateTime:
            localDateTimeToIso(
              startDate,
              startTime
            ),

          endDateTime:
            localDateTimeToIso(
              endDate,
              endTime
            ),

          scopeType:
            isAdmin
              ? 1
              : 2,

          departmentIds:
            isAdmin
              ? selectedDepartmentIds
              : [],

          projectId:
            isAdmin
              ? null
              : selectedProjectId,
        }
      );

      setModalOpen(
        false
      );

      resetForm();

      await load();
    } catch (error) {
      setMeetingError(
        error instanceof Error
          ? error.message
          : "Toplantı oluşturulamadı."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     EVENT STYLE
     ======================================================= */

  function getEventStyle(
    kind:
      CalendarEvent["kind"]
  ) {
    if (
      kind ===
      "project-start"
    ) {
      return `
        border-sky-200
        bg-sky-50
        text-sky-700

        dark:border-sky-400/25
        dark:bg-sky-400/[0.08]
        dark:text-sky-200
      `;
    }

    if (
      kind ===
      "project-end"
    ) {
      return `
        border-orange-200
        bg-orange-50
        text-orange-700

        dark:border-orange-400/25
        dark:bg-orange-400/[0.08]
        dark:text-orange-200
      `;
    }

    if (
      kind ===
      "task"
    ) {
      return `
        border-violet-200
        bg-violet-50
        text-violet-700

        dark:border-violet-400/25
        dark:bg-violet-400/[0.08]
        dark:text-violet-200
      `;
    }

    return `
      border-blue-300
      bg-blue-50
      text-blue-700

      dark:border-blue-400/30
      dark:bg-blue-400/[0.10]
      dark:text-blue-200
    `;
  }

  const canCreateMeeting =
    isAdmin ||
    isProjectManager;

  /* =========================================================
     VIEW
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        px-6
        py-8
        pb-24
        text-gray-950

        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          max-w-[1380px]
        "
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <div
          className="
            mb-7
            flex
            flex-wrap
            items-end
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-gray-400

                dark:text-slate-500
              "
            >
              Planlama
            </p>

            <h1
              className="
                mt-2
                text-[32px]
                font-bold
                tracking-[-0.04em]
                text-gray-950

                dark:text-white
              "
            >
              Takvim
            </h1>

            <p
              className="
                mt-2
                text-[12px]
                font-medium
                text-gray-500

                dark:text-slate-400
              "
            >
              Proje tarihlerini,
              görev teslimlerini ve
              online toplantıları
              tek ekrandan yönetin.
            </p>
          </div>

          {/* ACTIONS */}

          <div
            className="
              flex
              items-center
              gap-2.5
            "
          >
            <button
              type="button"
              onClick={
                load
              }
              className="
                inline-flex
                h-[44px]
                items-center
                gap-2
                rounded-[13px]
                border
                border-gray-200
                bg-white
                px-5
                text-[13px]
                font-medium
                text-gray-600
                shadow-sm
                transition

                hover:-translate-y-[1px]
                hover:border-gray-300
                hover:text-gray-900

                dark:border-slate-700
                dark:bg-[#0a1525]
                dark:text-slate-300
              "
            >
              <RefreshCw
                size={15}
              />

              Yenile
            </button>

            {canCreateMeeting && (
              <button
                type="button"
                onClick={
                  openModal
                }
                className="
                  inline-flex
                  h-[44px]
                  items-center
                  gap-2
                  rounded-[13px]
                  bg-[#070b17]
                  px-5
                  text-[13px]
                  font-medium
                  text-white
                  shadow-[0_8px_22px_rgba(15,23,42,0.15)]
                  transition

                  hover:-translate-y-[1px]
                  hover:bg-slate-800

                  dark:border
                  dark:border-blue-400/20
                  dark:bg-[#0a1525]
                "
              >
                <Plus
                  size={15}
                />

                Toplantı oluştur
              </button>
            )}
          </div>
        </div>

        {/* ===================================================
            CALENDAR
            =================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[27px]
            border
            border-white/80
            bg-white/91
            p-5
            shadow-[0_12px_40px_rgba(20,20,30,.06)]
            backdrop-blur-xl

            dark:border-slate-700
            dark:bg-[#081321]/95
          "
        >
          {/* =================================================
              MONTH
              ================================================= */}

          <div
            className="
              mb-5
              flex
              items-center
              justify-between
            "
          >
            <button
              type="button"
              onClick={() =>
                moveMonth(
                  -1
                )
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-[11px]
                border
                border-gray-200
                bg-white
                text-gray-600
                transition

                hover:bg-gray-50

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-300
              "
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <div
              className="
                text-center
              "
            >
              <h2
                className="
                  text-[21px]
                  font-bold
                  tracking-[-0.025em]
                  text-gray-900

                  dark:text-white
                "
              >
                {
                  months[
                    month
                  ]
                }{" "}
                {year}
              </h2>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-gray-400

                  dark:text-slate-500
                "
              >
                Aylık çalışma planı
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                moveMonth(
                  1
                )
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-[11px]
                border
                border-gray-200
                bg-white
                text-gray-600
                transition

                hover:bg-gray-50

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-300
              "
            >
              <ChevronRight
                size={17}
              />
            </button>
          </div>

          {loading && (
            <div
              className="
                py-24
                text-center
                text-[12px]
                font-medium
                text-gray-400
              "
            >
              Takvim yükleniyor...
            </div>
          )}

          {!loading &&
            error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-[12px]
                  font-medium
                  text-red-600
                "
              >
                {error}
              </div>
            )}

          {!loading &&
            !error && (
              <>
                {/* WEEK */}

                <div
                  className="
                    mb-2
                    grid
                    grid-cols-7
                    gap-2
                  "
                >
                  {weekdays.map(
                    day => (
                      <div
                        key={
                          day
                        }
                        className="
                          py-2.5
                          text-center
                          text-[10px]
                          font-bold
                          tracking-[0.12em]
                          text-gray-400

                          dark:text-slate-500
                        "
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* =================================================
                    CELLS
                    ================================================= */}

                <div
                  className="
                    grid
                    grid-cols-7
                    gap-2
                  "
                >
                  {cells.map(
                    (
                      day,
                      index
                    ) => {
                      if (!day) {
                        return (
                          <div
                            key={
                              index
                            }
                            className="
                              min-h-[132px]
                            "
                          />
                        );
                      }

                      const key =
                        `${year}-` +
                        `${String(
                          month + 1
                        ).padStart(
                          2,
                          "0"
                        )}-` +
                        `${String(
                          day
                        ).padStart(
                          2,
                          "0"
                        )}`;

                      const dayEvents =
                        events.filter(
                          event =>
                            event.date ===
                            key
                        );

                      const isToday =
                        key ===
                        dateKey(
                          new Date()
                            .toISOString()
                        );

                      return (
                        <div
                          key={
                            key
                          }
                          className={`
                            min-h-[132px]
                            rounded-[15px]
                            border
                            p-2.5
                            transition

                            ${
                              isToday
                                ? `
                                  border-gray-700
                                  bg-white

                                  dark:border-slate-300
                                  dark:bg-slate-900
                                `
                                : `
                                  border-gray-200
                                  bg-white/75

                                  dark:border-slate-800
                                  dark:bg-slate-900/65
                                `
                            }
                          `}
                        >
                          {/* NUMBER */}

                          <div
                            className={`
                              mb-2
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-full
                              text-[11px]
                              font-bold

                              ${
                                isToday
                                  ? `
                                    bg-black
                                    text-white

                                    dark:bg-white
                                    dark:text-black
                                  `
                                  : `
                                    text-gray-700

                                    dark:text-slate-300
                                  `
                              }
                            `}
                          >
                            {
                              day
                            }
                          </div>

                          {/* EVENTS */}

                          <div
                            className="
                              space-y-1.5
                            "
                          >
                            {dayEvents
                              .slice(
                                0,
                                4
                              )
                              .map(
                                item => (
                                  <button
                                    key={
                                      item.id
                                    }
                                    type="button"
                                    onClick={() => {
                                      if (
                                        item.href
                                      ) {
                                        router.push(
                                          item.href
                                        );
                                      }
                                    }}
                                    className={`
                                      flex
                                      w-full
                                      items-center
                                      gap-1.5
                                      rounded-[7px]
                                      border
                                      px-2
                                      py-[6px]
                                      text-left
                                      transition

                                      hover:-translate-y-[1px]
                                      hover:shadow-sm

                                      ${getEventStyle(
                                        item.kind
                                      )}
                                    `}
                                  >
                                    {item.kind ===
                                    "meeting" ? (
                                      <Video
                                        size={11}
                                        className="
                                          shrink-0
                                        "
                                      />
                                    ) : item.kind ===
                                      "task" ? (
                                      <Clock3
                                        size={11}
                                        className="
                                          shrink-0
                                        "
                                      />
                                    ) : (
                                      <span
                                        className={`
                                          h-1.5
                                          w-1.5
                                          shrink-0
                                          rounded-full

                                          ${
                                            item.kind ===
                                            "project-start"
                                              ? "bg-sky-500"
                                              : "bg-orange-500"
                                          }
                                        `}
                                      />
                                    )}

                                    <span
                                      className="
                                        min-w-0
                                        flex-1
                                        truncate
                                        text-[10px]
                                        font-semibold
                                      "
                                    >
                                      {
                                        item.title
                                      }
                                    </span>

                                    {item.subtitle && (
                                      <span
                                        className="
                                          shrink-0
                                          text-[8px]
                                          font-medium
                                          opacity-60
                                        "
                                      >
                                        {
                                          item.subtitle
                                        }
                                      </span>
                                    )}
                                  </button>
                                )
                              )}

                            {dayEvents.length >
                              4 && (
                              <p
                                className="
                                  px-1
                                  text-[9px]
                                  font-medium
                                  text-gray-400
                                "
                              >
                                +
                                {
                                  dayEvents.length -
                                  4
                                }{" "}
                                kayıt daha
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* =================================================
                    LEGEND
                    ================================================= */}

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    items-center
                    gap-x-6
                    gap-y-2
                    border-t
                    border-gray-100
                    pt-4

                    dark:border-slate-800
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-gray-500
                    "
                  >
                    <span
                      className="
                        h-2
                        w-2
                        rounded-full
                        bg-sky-500
                      "
                    />

                    Proje başlangıcı
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-gray-500
                    "
                  >
                    <span
                      className="
                        h-2
                        w-2
                        rounded-full
                        bg-orange-500
                      "
                    />

                    Proje bitişi
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-gray-500
                    "
                  >
                    <span
                      className="
                        h-2
                        w-2
                        rounded-full
                        bg-violet-500
                      "
                    />

                    Görev teslimi
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-blue-600
                    "
                  >
                    <Video
                      size={12}
                    />

                    Online toplantı
                  </span>
                </div>
              </>
            )}
        </section>
      </div>

      {/* =====================================================
          MEETING MODAL
          ===================================================== */}

      {modalOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/15
            px-4
            backdrop-blur-[3px]

            dark:bg-black/55
          "
          onMouseDown={
            closeModal
          }
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-[500px]
              overflow-y-auto
              rounded-[24px]
              border
              border-white/90
              bg-white
              p-6
              shadow-2xl

              dark:border-slate-700
              dark:bg-[#081321]
            "
            onMouseDown={
              event =>
                event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-blue-500
                  "
                >
                  Online Toplantı
                </p>

                <h2
                  className="
                    mt-2
                    text-[21px]
                    font-bold
                    tracking-[-0.025em]
                    text-gray-900

                    dark:text-white
                  "
                >
                  Toplantı oluştur
                </h2>

                <p
                  className="
                    mt-1.5
                    text-[10px]
                    leading-4
                    text-gray-500

                    dark:text-slate-400
                  "
                >
                  {isAdmin
                    ? "Seçtiğiniz departmanlardaki aktif kullanıcılar toplantıya otomatik eklenir."
                    : "Seçtiğiniz projenin üyeleri toplantıya otomatik eklenir."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-400
                  transition

                  hover:bg-gray-100

                  dark:hover:bg-slate-800
                "
              >
                <X
                  size={15}
                />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                submitMeeting
              }
              className="
                mt-5
                space-y-4
              "
            >
              {meetingError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-3.5
                    py-3
                    text-[10px]
                    font-medium
                    text-red-600
                  "
                >
                  {
                    meetingError
                  }
                </div>
              )}

              {/* TITLE */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-[10px]
                    font-bold
                    text-gray-700

                    dark:text-slate-300
                  "
                >
                  Toplantı adı
                </label>

                <input
                  autoFocus
                  value={
                    title
                  }
                  onChange={
                    event =>
                      setTitle(
                        event.target.value
                      )
                  }
                  placeholder="Örn. Sprint değerlendirmesi"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-3
                    text-[12px]
                    outline-none
                    transition

                    focus:border-gray-400

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                  "
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  className="
                    mb-2
                    block
                    text-[10px]
                    font-bold
                    text-gray-700

                    dark:text-slate-300
                  "
                >
                  Açıklama
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={
                    event =>
                      setDescription(
                        event.target.value
                      )
                  }
                  rows={3}
                  placeholder="Toplantı gündemi hakkında kısa açıklama..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-3.5
                    py-3
                    text-[12px]
                    outline-none
                    transition

                    focus:border-gray-400

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                  "
                />
              </div>

              {/* START */}

              <div>
                <label
                  className="
                    mb-2
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    font-bold
                    text-gray-700

                    dark:text-slate-300
                  "
                >
                  <CalendarDays
                    size={12}
                  />

                  Başlangıç
                </label>

                <div
                  className="
                    grid
                    grid-cols-[1fr_130px]
                    gap-3
                  "
                >
                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={
                      event => {
                        const value =
                          event.target.value;

                        setStartDate(
                          value
                        );

                        if (
                          endDate <
                          value
                        ) {
                          setEndDate(
                            value
                          );
                        }
                      }
                    }
                    className="
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />

                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={
                      event =>
                        setStartTime(
                          event.target.value
                        )
                    }
                    className="
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />
                </div>
              </div>

              {/* END */}

              <div>
                <label
                  className="
                    mb-2
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    font-bold
                    text-gray-700

                    dark:text-slate-300
                  "
                >
                  <CalendarDays
                    size={12}
                  />

                  Bitiş
                </label>

                <div
                  className="
                    grid
                    grid-cols-[1fr_130px]
                    gap-3
                  "
                >
                  <input
                    type="date"
                    value={
                      endDate
                    }
                    min={
                      startDate
                    }
                    onChange={
                      event =>
                        setEndDate(
                          event.target.value
                        )
                    }
                    className="
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />

                  <input
                    type="time"
                    value={
                      endTime
                    }
                    onChange={
                      event =>
                        setEndTime(
                          event.target.value
                        )
                    }
                    className="
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-3
                      text-[11px]

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  ADMIN DEPARTMENTS
                  ================================================= */}

              {isAdmin && (
                <div>
                  <label
                    className="
                      mb-2
                      flex
                      items-center
                      gap-1.5
                      text-[10px]
                      font-bold
                      text-gray-700

                      dark:text-slate-300
                    "
                  >
                    <Users
                      size={12}
                    />

                    Departmanlar
                  </label>

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-2
                    "
                  >
                    {departments.map(
                      department => {
                        const selected =
                          selectedDepartmentIds.includes(
                            department.id
                          );

                        return (
                          <button
                            key={
                              department.id
                            }
                            type="button"
                            onClick={() =>
                              toggleDepartment(
                                department.id
                              )
                            }
                            className={`
                              flex
                              min-h-[48px]
                              items-center
                              justify-between
                              gap-3
                              rounded-xl
                              border
                              px-3
                              py-2.5
                              text-left
                              transition

                              ${
                                selected
                                  ? `
                                    border-blue-300
                                    bg-blue-50

                                    dark:border-blue-400/35
                                    dark:bg-blue-400/10
                                  `
                                  : `
                                    border-gray-200
                                    bg-white

                                    hover:bg-gray-50

                                    dark:border-slate-700
                                    dark:bg-slate-900
                                  `
                              }
                            `}
                          >
                            <div
                              className="
                                min-w-0
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-[11px]
                                  font-semibold
                                  text-gray-700

                                  dark:text-slate-200
                                "
                              >
                                {
                                  department.name
                                }
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[8px]
                                  text-gray-400
                                "
                              >
                                {
                                  department.userCount ??
                                  0
                                }{" "}
                                aktif kullanıcı
                              </p>
                            </div>

                            <div
                              className={`
                                flex
                                h-4
                                w-4
                                items-center
                                justify-center
                                rounded-[4px]
                                border

                                ${
                                  selected
                                    ? `
                                      border-blue-500
                                      bg-blue-500
                                      text-white
                                    `
                                    : `
                                      border-gray-300
                                      bg-white
                                    `
                                }
                              `}
                            >
                              {selected && (
                                <span
                                  className="
                                    text-[9px]
                                    font-bold
                                  "
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* =================================================
                  PROJECT MANAGER
                  ================================================= */}

              {!isAdmin &&
                isProjectManager && (
                  <div>
                    <label
                      className="
                        mb-2
                        flex
                        items-center
                        gap-1.5
                        text-[10px]
                        font-bold
                        text-gray-700

                        dark:text-slate-300
                      "
                    >
                      <FolderKanban
                        size={12}
                      />

                      Proje
                    </label>

                    <select
                      value={
                        selectedProjectId
                      }
                      onChange={
                        event =>
                          setSelectedProjectId(
                            event.target.value
                          )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-3.5
                        py-3
                        text-[12px]

                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-white
                      "
                    >
                      <option value="">
                        Proje seçin
                      </option>

                      {managerProjects.map(
                        project => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            {
                              project.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

              {/* INFO */}

              <div
                className="
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50/60
                  px-3.5
                  py-3

                  dark:border-blue-400/20
                  dark:bg-blue-400/[0.06]
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-2.5
                  "
                >
                  <Video
                    size={14}
                    className="
                      mt-0.5
                      text-blue-500
                    "
                  />

                  <div>
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        text-blue-700

                        dark:text-blue-200
                      "
                    >
                      Online görüşme
                    </p>

                    <p
                      className="
                        mt-1
                        text-[9px]
                        leading-4
                        text-blue-600/70
                      "
                    >
                      Toplantı oluşturulduğunda
                      ilgili kullanıcıların
                      takvimine eklenir ve
                      bildirim gönderilir.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div
                className="
                  flex
                  justify-end
                  gap-2
                  border-t
                  border-gray-100
                  pt-4

                  dark:border-slate-800
                "
              >
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2.5
                    text-[11px]
                    font-medium
                    text-gray-600

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-300
                  "
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-black
                    px-4
                    py-2.5
                    text-[11px]
                    font-semibold
                    text-white

                    disabled:opacity-50

                    dark:bg-white
                    dark:text-black
                  "
                >
                  <CalendarDays
                    size={14}
                  />

                  {saving
                    ? "Oluşturuluyor..."
                    : "Toplantı oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}