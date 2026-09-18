"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  FileText,
  Download,
  Upload,
  BellRing,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  approveProjectCompletion,
  deleteProject,
  getProjectById,
  getProjects,
  Project,
} from "@/services/projectService";

import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  TaskItem,
} from "@/services/taskService";

import {
  addProjectMember,
  AvailableProjectUser,
  getAvailableProjectUsers,
  getProjectMembers,
  ProjectMember,
} from "@/services/projectMemberService";

import {
  getProjectMessages,
  ProjectMessage,
  sendProjectMessage,
} from "@/services/projectMessageService";

import {
  getStoredToken,
} from "@/services/authService";

import {
  Department,
  getDepartments,
} from "@/services/departmentService";

import {
  addTaskComment,
  CommentItem,
  AttachmentItem,
  downloadAttachment,
  getAttachments,
  getTaskComments,
  uploadAttachment,
} from "@/services/taskExtrasService";

type JwtPayload = {
  sub?: string;

  role?: string;
  roles?: string[];

  [key: string]: any;
};

function decodeJwtPayload(
  token: string
): JwtPayload | null {
  try {
    const payload =
      token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return JSON.parse(
      decodeURIComponent(
        window
          .atob(normalized)
          .split("")
          .map(
            (char) =>
              "%" +
              (
                "00" +
                char
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)
          )
          .join("")
      )
    );
  } catch {
    return null;
  }
}

function getCurrentUserData() {
  const token =
    getStoredToken();

  if (!token) {
    return {
      role: "",
      userId: "",
    };
  }

  const payload =
    decodeJwtPayload(
      token
    );

  if (!payload) {
    return {
      role: "",
      userId: "",
    };
  }

  let role = "";

  if (
    typeof payload.role ===
    "string"
  ) {
    role =
      payload.role;
  }

  if (
    !role &&
    Array.isArray(
      payload.roles
    )
  ) {
    role =
      payload.roles[0] ??
      "";
  }

  const microsoftRole =
    payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ];

  if (
    !role &&
    typeof microsoftRole ===
      "string"
  ) {
    role =
      microsoftRole;
  }

  const microsoftId =
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ];

  let userId = "";

  if (
    typeof microsoftId ===
    "string"
  ) {
    userId =
      microsoftId;
  } else if (
    typeof payload.sub ===
    "string"
  ) {
    userId =
      payload.sub;
  }

  return {
    role,
    userId,
  };
}

function normalizeRole(
  role: string
) {
  return role
    .replace(/\s/g, "")
    .toLowerCase();
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Belirtilmedi";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatMessageDate(
  value: string
) {
  const date =
    new Date(value);

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getStatus(
  status?: string | number
) {
  if (
    typeof status ===
    "string"
  ) {
    return status;
  }

  switch (status) {
    case 0:
      return "Planlama";

    case 1:
      return "Aktif";

    case 2:
    case 4:
      return "Tamamlandı";

    case 3:
      return "Beklemede";

    case 5:
      return "İptal";

    case 6:
      return "Onay Bekliyor";

    default:
      return "Belirsiz";
  }
}

function getTaskStatus(
  task: TaskItem
) {
  return isTaskDone(task)
    ? "Yapıldı"
    : "Yapılacak";
}


function isTaskDone(
  task: TaskItem
) {
  const value =
    String(task.status ?? "")
      .replace(/\s/g, "")
      .toLowerCase();

  return (
    task.status === 4 ||
    value === "done" ||
    value === "completed" ||
    value === "tamamlandı" ||
    value === "tamamlandi"
  );
}

function isTaskOverdue(
  task: TaskItem
) {
  if (
    !task.dueDate ||
    isTaskDone(task)
  ) {
    return false;
  }

  const due =
    new Date(task.dueDate);

  due.setHours(
    23,
    59,
    59,
    999
  );

  return (
    task.isOverdue === true ||
    due.getTime() <
      Date.now()
  );
}

function getMemberName(
  member: ProjectMember
) {
  return (
    member.fullName ||
    `${member.firstName} ${member.lastName}`.trim() ||
    member.email
  );
}

function getAvailableName(
  user: AvailableProjectUser
) {
  return (
    `${user.firstName} ${user.lastName}`.trim() ||
    user.email
  );
}

export default function ProjectDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const projectId =
    String(
      params.id || ""
    );

  const [
    project,
    setProject,
  ] =
    useState<Project | null>(
      null
    );

  const [
    departments,
    setDepartments,
  ] =
    useState<Department[]>(
      []
    );

  const [
    allProjects,
    setAllProjects,
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
    members,
    setMembers,
  ] =
    useState<ProjectMember[]>(
      []
    );

  const [
    availableUsers,
    setAvailableUsers,
  ] =
    useState<AvailableProjectUser[]>(
      []
    );

  const [
    messages,
    setMessages,
  ] =
    useState<ProjectMessage[]>(
      []
    );

  const [
    role,
    setRole,
  ] =
    useState("");

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState("");

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

  /* MEMBER MODAL */

  const [
    showMemberModal,
    setShowMemberModal,
  ] =
    useState(false);

  const [
    selectedMemberUserId,
    setSelectedMemberUserId,
  ] =
    useState("");


  const [
    addingMember,
    setAddingMember,
  ] =
    useState(false);

  const [
    memberError,
    setMemberError,
  ] =
    useState("");

  /* TASK MODAL */

  const [
    showTaskModal,
    setShowTaskModal,
  ] =
    useState(false);

  const [
    taskTitle,
    setTaskTitle,
  ] =
    useState("");

  const [
    taskDescription,
    setTaskDescription,
  ] =
    useState("");

  const [
    taskPriority,
    setTaskPriority,
  ] =
    useState("2");

  const [
    taskDueDate,
    setTaskDueDate,
  ] =
    useState("");

  const [
    assignedUserId,
    setAssignedUserId,
  ] =
    useState("");

  const [
    creatingTask,
    setCreatingTask,
  ] =
    useState(false);

  const [
    taskError,
    setTaskError,
  ] =
    useState("");

  /* MESSAGES */

  const [
    chatOpen,
    setChatOpen,
  ] =
    useState(false);

  const [
    messageText,
    setMessageText,
  ] =
    useState("");

  const [
    recipientUserId,
    setRecipientUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    sendingMessage,
    setSendingMessage,
  ] =
    useState(false);

  const [
    messageError,
    setMessageError,
  ] =
    useState("");



  const [
    activeTab,
    setActiveTab,
  ] =
    useState<
      "tasks" |
      "members" |
      "files"
    >("tasks");

  const [
    attachments,
    setAttachments,
  ] =
    useState<
      Record<
        string,
        AttachmentItem[]
      >
    >({});

  const [
    attachmentDescriptions,
    setAttachmentDescriptions,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    selectedFileTaskId,
    setSelectedFileTaskId,
  ] =
    useState("");

  const [
    uploadDescription,
    setUploadDescription,
  ] =
    useState("");

  const [
    selectedPdf,
    setSelectedPdf,
  ] =
    useState<File | null>(
      null
    );

  const [
    uploadingPdf,
    setUploadingPdf,
  ] =
    useState(false);

  const [
    fileError,
    setFileError,
  ] =
    useState("");

  const [
    delaySendingTaskId,
    setDelaySendingTaskId,
  ] =
    useState<string | null>(
      null
    );

  const [
    taskComments,
    setTaskComments,
  ] = useState<
    Record<string, CommentItem[]>
  >({});

  const [
    openCommentTaskId,
    setOpenCommentTaskId,
  ] = useState<string | null>(
    null
  );

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    commentSaving,
    setCommentSaving,
  ] = useState(false);

  const [
    updatingTaskId,
    setUpdatingTaskId,
  ] = useState<string | null>(
    null
  );

  const normalizedRole =
    normalizeRole(
      role
    );

  const isAdmin =
    normalizedRole ===
    "admin";

  const isProjectManager =
    normalizedRole ===
    "projectmanager";

  const isAssignedManager =
    project?.projectManagerId
      ?.toLowerCase() ===
    currentUserId
      .toLowerCase();

  const canManageProject =
    isAdmin ||
    (
      isProjectManager &&
      isAssignedManager
    );

  const canApprove =
    isProjectManager &&
    isAssignedManager;

  const allTasksDone =
    tasks.length > 0 &&
    tasks.every(
      isTaskDone
    );

  async function loadAll() {
    try {
      setLoading(true);

      setError("");

      const [
        projectResult,
        departmentResult,
        allProjectResult,
        taskResult,
        memberResult,
        userResult,
        messageResult,
      ] =
        await Promise.all([
          getProjectById(
            projectId
          ),

          getDepartments()
            .catch(() => []),

          getProjects()
            .catch(() => []),

          getProjectTasks(
            projectId
          ),

          getProjectMembers(
            projectId
          ),

          getAvailableProjectUsers()
            .catch(() => []),

          getProjectMessages(
            projectId
          ).catch(() => []),
        ]);

      setProject(
        projectResult
      );

      setDepartments(
        departmentResult
      );

      setAllProjects(
        allProjectResult
      );

      setTasks(
        taskResult
      );

      setMembers(
        memberResult
      );

      setAvailableUsers(
        userResult
      );

      setMessages(
        messageResult
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Proje yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current =
      getCurrentUserData();

    setRole(
      current.role
    );

    setCurrentUserId(
      current.userId
    );

    if (projectId) {
      loadAll();
    }
  }, [projectId]);


  useEffect(() => {
    if (
      activeTab ===
        "files" &&
      tasks.length > 0
    ) {
      loadProjectFiles();
    }
  }, [
    activeTab,
    tasks.length,
  ]);

  /*
   * Sadece projenin departmanındaki
   * kullanıcıları seçiyoruz.
   */

  const selectableUsers =
    useMemo(() => {
      if (!project) {
        return [];
      }

      const existingIds =
        new Set(
          members.map(
            (member) =>
              member.userId
                .toLowerCase()
          )
        );

      return availableUsers.filter(
        (user) => {
          if (
            existingIds.has(
              user.id.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            !project.departmentName
          ) {
            return true;
          }

          return (
            user.department
              ?.trim()
              .toLowerCase() ===
            project.departmentName
              .trim()
              .toLowerCase()
          );
        }
      );
    }, [
      project,
      members,
      availableUsers,
    ]);

  async function handleAddMember(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setAddingMember(true);

      setMemberError("");

      await addProjectMember({
        projectId,

        userId:
          selectedMemberUserId,

        role: 0,
      });

      setShowMemberModal(
        false
      );

      setSelectedMemberUserId(
        ""
      );

      await loadAll();
    } catch (err) {
      setMemberError(
        err instanceof Error
          ? err.message
          : "Kullanıcı eklenemedi."
      );
    } finally {
      setAddingMember(false);
    }
  }

  async function handleCreateTask(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreatingTask(true);

      setTaskError("");

      if (taskTitle.trim().length < 3) {
        throw new Error("Görev başlığı en az 3 karakter olmalıdır.");
      }

      if (taskDescription.trim().length < 3) {
        throw new Error("Görev açıklaması zorunludur ve en az 3 karakter olmalıdır.");
      }

      if (!assignedUserId) {
        throw new Error("Görevin atanacağı kişiyi seçin.");
      }

      await createTask({
        projectId,

        title:
          taskTitle,

        description:
          taskDescription.trim(),

        assignedUserId:
          assignedUserId ||
          null,

        priority:
          Number(
            taskPriority
          ),

        dueDate:
          taskDueDate ||
          null,
      });

      setShowTaskModal(
        false
      );

      setTaskTitle("");

      setTaskDescription("");

      setTaskPriority("2");

      setTaskDueDate("");

      setAssignedUserId("");

      await loadAll();
    } catch (err) {
      setTaskError(
        err instanceof Error
          ? err.message
          : "Görev oluşturulamadı."
      );
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleSendMessage() {
    try {
      setSendingMessage(true);

      setMessageError("");

      await sendProjectMessage(
        projectId,
        messageText,
        recipientUserId
      );

      setMessageText("");

      const result =
        await getProjectMessages(
          projectId
        );

      setMessages(
        result
      );
    } catch (err) {
      setMessageError(
        err instanceof Error
          ? err.message
          : "Mesaj gönderilemedi."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  async function loadProjectFiles() {
    const nextAttachments:
      Record<
        string,
        AttachmentItem[]
      > = {};

    const nextDescriptions:
      Record<
        string,
        string
      > = {};

    await Promise.all(
      tasks.map(
        async (task) => {
          const [
            taskFiles,
            taskComments,
          ] =
            await Promise.all([
              getAttachments(
                task.id
              ).catch(
                () => []
              ),

              getTaskComments(
                task.id
              ).catch(
                () => []
              ),
            ]);

          nextAttachments[
            task.id
          ] =
            taskFiles;

          for (
            const file of
            taskFiles
          ) {
            const prefix =
              `[DOSYA:${file.originalFileName}]`;

            const comment =
              [...taskComments]
                .reverse()
                .find(
                  (item) =>
                    item.content
                      .trim()
                      .startsWith(
                        prefix
                      )
                );

            nextDescriptions[
              file.id
            ] =
              comment
                ? comment.content
                    .trim()
                    .slice(
                      prefix.length
                    )
                    .trim()
                : "Açıklama bulunamadı.";
          }
        }
      )
    );

    setAttachments(
      nextAttachments
    );

    setAttachmentDescriptions(
      nextDescriptions
    );

    if (
      !selectedFileTaskId &&
      tasks.length > 0
    ) {
      setSelectedFileTaskId(
        tasks[0].id
      );
    }
  }

  async function handleUploadPdf(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setFileError("");

      if (
        !selectedFileTaskId
      ) {
        throw new Error(
          "Dosyanın bağlı olacağı görev seçilmelidir."
        );
      }

      if (
        !uploadDescription.trim()
      ) {
        throw new Error(
          "Dosya açıklaması zorunludur."
        );
      }

      if (!selectedPdf) {
        throw new Error(
          "PDF dosyası seçilmelidir."
        );
      }

      const isPdf =
        selectedPdf.type ===
          "application/pdf" ||
        selectedPdf.name
          .toLowerCase()
          .endsWith(
            ".pdf"
          );

      if (!isPdf) {
        throw new Error(
          "Yalnızca PDF formatında dosya yüklenebilir."
        );
      }

      setUploadingPdf(
        true
      );

      await uploadAttachment(
        selectedFileTaskId,
        selectedPdf,
        uploadDescription.trim()
      );

      setSelectedPdf(
        null
      );

      setUploadDescription(
        ""
      );

      const input =
        document.getElementById(
          "project-pdf-input"
        ) as
          | HTMLInputElement
          | null;

      if (input) {
        input.value = "";
      }

      await loadProjectFiles();
    } catch (err) {
      setFileError(
        err instanceof Error
          ? err.message
          : "Dosya yüklenemedi."
      );
    } finally {
      setUploadingPdf(
        false
      );
    }
  }

  async function loadTaskComments(
    taskId: string
  ) {
    try {
      const result =
        await getTaskComments(
          taskId
        );

      setTaskComments(
        (current) => ({
          ...current,
          [taskId]: result,
        })
      );
    } catch {
      setTaskComments(
        (current) => ({
          ...current,
          [taskId]: [],
        })
      );
    }
  }

  async function toggleTaskComments(
    taskId: string
  ) {
    if (
      openCommentTaskId ===
      taskId
    ) {
      setOpenCommentTaskId(
        null
      );
      setCommentText("");
      return;
    }

    setOpenCommentTaskId(
      taskId
    );
    setCommentText("");
    await loadTaskComments(
      taskId
    );
  }

  async function handleAddTaskComment(
    task: TaskItem
  ) {
    if (
      !canManageProject ||
      !commentText.trim()
    ) {
      return;
    }

    try {
      setCommentSaving(true);

      await addTaskComment(
        task.id,
        commentText.trim()
      );

      setCommentText("");
      await loadTaskComments(
        task.id
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Yorum eklenemedi."
      );
    } finally {
      setCommentSaving(false);
    }
  }

  function canChangeTaskStatus(
    task: TaskItem
  ) {
    return (
      canManageProject ||
      task.assignedUserId
        ?.toLowerCase() ===
        currentUserId
          .toLowerCase()
    );
  }

  async function handleToggleTaskStatus(
    task: TaskItem
  ) {
    if (
      !canChangeTaskStatus(
        task
      )
    ) {
      return;
    }

    try {
      setUpdatingTaskId(
        task.id
      );

      await updateTaskStatus(
        task.id,
        isTaskDone(task)
          ? 1
          : 4
      );

      const refreshed =
        await getProjectTasks(
          projectId
        );

      setTasks(refreshed);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Görev durumu güncellenemedi."
      );
    } finally {
      setUpdatingTaskId(
        null
      );
    }
  }

  async function handleDelayNotification(
    task: TaskItem
  ) {
    if (
      !task.assignedUserId
    ) {
      alert(
        "Bu göreve henüz bir kullanıcı atanmadığı için bildirim gönderilemez."
      );

      return;
    }

    const defaultMessage =
      `"${task.title}" görevinin teslim tarihi geçti. Gecikme nedenini ve güncel durumu bildirir misiniz?`;

    const reason =
      window.prompt(
        "Görevliye gönderilecek bildirim mesajı:",
        defaultMessage
      );

    if (
      !reason?.trim()
    ) {
      return;
    }

    try {
      setDelaySendingTaskId(
        task.id
      );

      await addTaskComment(
        task.id,
        `Gecikme bildirimi: ${reason.trim()}`
      );

      await loadTaskComments(
        task.id
      );

      setOpenCommentTaskId(
        task.id
      );

      alert(
        "Gecikme bildirimi görev yorumuna eklendi ve görevliye bildirim gönderildi."
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Bildirim gönderilemedi."
      );
    } finally {
      setDelaySendingTaskId(
        null
      );
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Bu projeyi silmek istediğinizden emin misiniz?"
      )
    ) {
      return;
    }

    try {
      await deleteProject(
        projectId
      );

      router.push(
        "/projects"
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Proje silinemedi."
      );
    }
  }

  async function handleApprove() {
    try {
      const updated =
        await approveProjectCompletion(
          projectId
        );

      setProject(
        updated
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Onay verilemedi."
      );
    }
  }

  function startPrivateMessage(
    userId: string
  ) {
    setRecipientUserId(
      userId
    );

    setMessageText(
      ""
    );

    setChatOpen(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-[1200px] rounded-[24px] border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Proje yükleniyor...
        </div>
      </main>
    );
  }

  if (
    error ||
    !project
  ) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-[1200px] rounded-[24px] border border-red-200 bg-white p-8 text-red-600">
          {error ||
            "Proje bulunamadı."}
        </div>
      </main>
    );
  }

  /*
   * Projeler ekranındaki renk sırası birebir korunur.
   * Renk index'i tüm departmanlardan değil, yalnızca projesi olan
   * departmanlardan hesaplanır. Böylece Projeler ekranında İnsan
   * Kaynakları mor ise detay ekranında da mor kalır.
   */
  const activeDepartments =
    departments.filter(
      (department) =>
        department.isActive !== false
    );

  const projectDepartments =
    activeDepartments.filter(
      (department) =>
        allProjects.some(
          (item) =>
            item.departmentId?.toLowerCase() ===
            department.id.toLowerCase()
        )
    );

  const departmentIndex =
    projectDepartments.findIndex(
      (department) =>
        department.id.toLowerCase() ===
        project.departmentId?.toLowerCase()
    );

  const safeDepartmentIndex =
    departmentIndex >= 0
      ? departmentIndex
      : 0;

  const departmentTheme =
    safeDepartmentIndex % 3 === 0
      ? {
          header:
            "border-indigo-300 bg-indigo-50/80 dark:border-indigo-400/45 dark:bg-[#0b1424]",
          content:
            "border-indigo-200/90 dark:border-indigo-400/30",
          icon:
            "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400/35 dark:text-indigo-300 dark:hover:bg-indigo-400/10",
          tab:
            "border-indigo-500 text-indigo-600 dark:border-indigo-300 dark:text-indigo-300",
        }
      : safeDepartmentIndex % 3 === 1
        ? {
            header:
              "border-emerald-300 bg-emerald-50/75 dark:border-emerald-400/45 dark:bg-[#0b1420]",
            content:
              "border-emerald-200/90 dark:border-emerald-400/30",
            icon:
              "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/35 dark:text-emerald-300 dark:hover:bg-emerald-400/10",
            tab:
              "border-emerald-500 text-emerald-600 dark:border-emerald-300 dark:text-emerald-300",
          }
        : {
            header:
              "border-orange-300 bg-orange-50/75 dark:border-orange-400/45 dark:bg-[#15120f]",
            content:
              "border-orange-200/90 dark:border-orange-400/30",
            icon:
              "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-400/35 dark:text-orange-300 dark:hover:bg-orange-400/10",
            tab:
              "border-orange-500 text-orange-600 dark:border-orange-300 dark:text-orange-300",
          };

  const selectedRecipient =
    members.find(
      (member) =>
        member.userId ===
        recipientUserId
    );

  return (
    <main className="min-h-screen px-6 py-8">

      <div className="mx-auto max-w-[1200px]">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/projects"
            )
          }
          className="mb-5 flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft
            size={14}
          />

          Projelere Dön
        </button>

        {/* PROJECT HEADER */}

        <section
          className={`rounded-[26px] border-[1.5px] p-6 shadow-[0_12px_34px_rgba(15,23,42,0.045)] ${departmentTheme.header}`}
        >
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[30px] font-bold tracking-[-0.04em] text-gray-900 dark:text-white">
                  {project.name}
                </h1>

                {project.requiresMemberApproval && (
                  <span className="inline-flex items-center rounded-full border border-red-200/90 bg-red-50/80 px-3 py-1.5 text-[10px] font-bold text-red-600 shadow-sm dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300 dark:shadow-none">
                    Proje Yöneticisi onayı gerekli
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-[820px] text-[13px] leading-6 text-gray-600 dark:text-gray-300">
                {project.description || "Bu proje için açıklama eklenmemiş."}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-white/85 transition dark:bg-white/5 ${departmentTheme.icon}`}
                aria-label="Proje mesajlarını aç"
                title="Mesajlar"
              >
                <MessageCircle size={15} />
              </button>

              {(isAdmin ||
                (isProjectManager &&
                  project.ownerId === currentUserId)) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white/80 text-red-500 transition hover:bg-red-50 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                  aria-label="Projeyi sil"
                  title="Projeyi sil"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* PROJECT INFO CARDS */}

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-white/90 bg-white/80 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/55 dark:shadow-none">
              <div className="text-[11px] font-bold uppercase tracking-[0.11em] text-gray-500 dark:text-gray-400">
                Proje Yöneticisi
              </div>
              <p className="mt-2.5 text-[18px] font-bold text-gray-900 dark:text-white">
                {project.projectManagerName || "Atanmadı"}
              </p>
            </div>

            <div className="rounded-[18px] border border-white/90 bg-white/80 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/55 dark:shadow-none">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-gray-500 dark:text-gray-400">
                <CalendarDays size={13} />
                Proje Tarihi
              </div>
              <p className="mt-2.5 text-[14px] font-bold text-gray-900 dark:text-white">
                {formatDate(project.startDate)}
                <span className="mx-2 text-gray-300">→</span>
                {formatDate(project.endDate)}
              </p>
            </div>

            <div className="rounded-[18px] border border-white/90 bg-white/80 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/55 dark:shadow-none">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-gray-500 dark:text-gray-400">
                <Users size={13} />
                Proje Ekibi
              </div>
              <p className="mt-2.5 text-[18px] font-bold text-gray-900 dark:text-white">
                {members.length} kişi
              </p>
            </div>
          </div>
        </section>

        {/* PROJECT CONTENT TABS */}

        <section className={`mt-5 overflow-hidden rounded-[24px] border bg-white dark:bg-[#0b1424] ${departmentTheme.content}`}>

          <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 px-5 pt-3">

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "tasks"
                )
              }
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-[13px] font-bold transition ${
                activeTab ===
                "tasks"
                  ? departmentTheme.tab
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <FolderKanban
                size={14}
              />
              Görevler
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "members"
                )
              }
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-[13px] font-bold transition ${
                activeTab ===
                "members"
                  ? departmentTheme.tab
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Users
                size={14}
              />
              Kişiler
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "files"
                )
              }
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-[13px] font-bold transition ${
                activeTab ===
                "files"
                  ? departmentTheme.tab
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <FileText
                size={14}
              />
              Dosyalar
            </button>

          </div>

          {activeTab ===
            "tasks" && (
            <div className="p-5">

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                      Görevler
                    </h2>

                    <span className="rounded-lg bg-gray-50 px-2 py-1 text-[9px] font-bold text-gray-500">
                      {
                        tasks.length
                      }{" "}
                      görev
                    </span>

                  </div>

                  <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    Projedeki güncel işler, sorumlular ve teslim tarihleri.
                  </p>

                </div>

                {canManageProject && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowTaskModal(
                        true
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-[13px] font-bold text-white transition hover:bg-gray-800"
                  >
                    <Plus
                      size={14}
                    />
                    Yeni Görev
                  </button>
                )}

              </div>

              <div className="mt-5 space-y-3">

                {tasks.length ===
                0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[18px] border border-gray-100 text-center dark:border-white/10">

                    <FolderKanban
                      size={26}
                      className="text-gray-300"
                    />

                    <p className="mt-3 text-[13px] font-bold text-gray-800 dark:text-white">
                      Henüz görev yok
                    </p>

                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Proje görevleri burada görüntülenecek.
                    </p>

                  </div>
                ) : (
                  tasks.map(
                    (task) => {
                      const overdue =
                        isTaskOverdue(
                          task
                        );

                      return (
                        <div
                          key={
                            task.id
                          }
                          className={`rounded-[18px] border px-4 py-4 ${
                            overdue
                              ? "border-red-400 bg-red-50/45 shadow-[0_0_0_1px_rgba(248,113,113,0.08)] dark:border-red-400/60 dark:bg-red-500/8"
                              : "border-gray-100 bg-white dark:border-white/10 dark:bg-transparent"
                          }`}
                        >

                          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.8fr_0.65fr_0.7fr_auto] lg:items-center">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="truncate text-[12px] font-bold text-gray-900">
                                {
                                  task.title
                                }
                              </p>

                              {overdue && (
                                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[8px] font-bold text-red-600">
                                  Gecikti
                                </span>
                              )}

                            </div>

                            <p className="mt-1 truncate text-[10px] text-gray-400">
                              {task.description ||
                                "Açıklama yok"}
                            </p>

                          </div>

                          <div>

                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400">
                              Sorumlu
                            </p>

                            <p className="mt-1 truncate text-[11px] font-semibold text-gray-650">
                              {task.assignedUserFullName ||
                                task.assignedUserName ||
                                "Atanmamış"}
                            </p>

                          </div>

                          <div>

                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400">
                              Durum
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleTaskStatus(
                                  task
                                )
                              }
                              disabled={
                                updatingTaskId ===
                                  task.id ||
                                !canChangeTaskStatus(
                                  task
                                )
                              }
                              title={
                                canChangeTaskStatus(task)
                                  ? "Görev durumunu değiştir"
                                  : undefined
                              }
                              className={`mt-1 inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${
                                isTaskDone(task)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300"
                              } ${
                                canChangeTaskStatus(task)
                                  ? "cursor-pointer hover:opacity-80"
                                  : "cursor-default"
                              }`}
                            >
                              {updatingTaskId === task.id
                                ? "Güncelleniyor..."
                                : getTaskStatus(task)}
                            </button>

                          </div>

                          <div>

                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400">
                              Bitiş Tarihi
                            </p>

                            <p className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${
                              overdue
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}>
                              <Clock3
                                size={11}
                              />
                              {formatDate(
                                task.dueDate
                              )}
                            </p>

                          </div>

                          <div className="flex flex-wrap justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                toggleTaskComments(
                                  task.id
                                )
                              }
                              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-bold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                            >
                              <MessageCircle size={12} />
                              Yorumlar
                            </button>

                            {overdue &&
                              canManageProject && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelayNotification(
                                    task
                                  )
                                }
                                disabled={
                                  delaySendingTaskId ===
                                  task.id
                                }
                                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[9px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <BellRing
                                  size={12}
                                />
                                {delaySendingTaskId ===
                                task.id
                                  ? "Gönderiliyor..."
                                  : "Neden gecikti?"}
                              </button>
                            )}

                          </div>

                          </div>

                          {openCommentTaskId === task.id && (
                            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">
                                    Görev Yorumları
                                  </h3>
                                  <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                    Yorumları proje üyeleri görebilir. Yorum ekleme yetkisi Admin ve Proje Yöneticisindedir.
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 space-y-2">
                                {(taskComments[task.id] ?? []).length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-[10px] text-gray-400 dark:border-white/10">
                                    Bu görev için henüz yorum yok.
                                  </div>
                                ) : (
                                  (taskComments[task.id] ?? []).map((comment) => (
                                    <div
                                      key={comment.id}
                                      className={`rounded-xl border px-3.5 py-3 ${
                                        comment.content.startsWith("Gecikme bildirimi:")
                                          ? "border-red-200 bg-red-50/55 dark:border-red-400/25 dark:bg-red-500/8"
                                          : "border-gray-100 bg-gray-50/60 dark:border-white/10 dark:bg-white/5"
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                                          {comment.userFullName || "Kullanıcı"}
                                        </span>
                                        <span className="text-[9px] text-gray-400">
                                          {formatMessageDate(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-5 text-gray-600 dark:text-gray-300">
                                        {comment.content}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {canManageProject && (
                                <div className="mt-3 flex items-end gap-2">
                                  <textarea
                                    value={commentText}
                                    onChange={(event) =>
                                      setCommentText(event.target.value)
                                    }
                                    rows={2}
                                    placeholder="Görev hakkında yorum yazın..."
                                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[11px] text-gray-800 outline-none focus:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddTaskComment(task)
                                    }
                                    disabled={
                                      commentSaving ||
                                      !commentText.trim()
                                    }
                                    className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-black px-4 text-[10px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                  >
                                    <Send size={13} />
                                    Yorum Ekle
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    }
                  )
                )}

              </div>

              {project.requiresMemberApproval &&
                canApprove &&
                allTasksDone &&
                getStatus(project.status) !== "Tamamlandı" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={13} />
                      Projeyi Onayla
                    </button>
                  </div>
                )}

            </div>
          )}

          {activeTab ===
            "members" && (
            <div className="p-5">

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                <div>

                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                    Proje Ekibi
                  </h2>

                  <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    Projede görev alan kullanıcılar.
                  </p>

                </div>

                {canManageProject && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowMemberModal(
                        true
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-[13px] font-bold text-white"
                  >
                    <UserPlus
                      size={14}
                    />
                    Kişi Ekle
                  </button>
                )}

              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

                {members.map(
                  (member) => {
                    const manager =
                      member.userId
                        .toLowerCase() ===
                      project.projectManagerId
                        .toLowerCase();

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-[16px] border border-gray-100 bg-gray-50/55 p-4 text-left dark:border-white/10 dark:bg-white/5"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                          {getMemberName(
                            member
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
                            {getMemberName(
                              member
                            )}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                            {manager
                              ? "Proje Yöneticisi"
                              : "Üye"}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>
          )}

          {activeTab ===
            "files" && (
            <div className="p-5">

              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

                <div>

                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
                    Dosyalar
                  </h2>

                  <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                    Proje üyeleri PDF dosyası yükleyebilir. Dosya açıklaması zorunludur.
                  </p>

                </div>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-bold text-blue-600">
                  Yalnızca PDF
                </span>

              </div>

              {tasks.length ===
              0 ? (
                <div className="mt-5 flex min-h-[240px] flex-col items-center justify-center rounded-[18px] border border-dashed border-gray-200 text-center">

                  <FileText
                    size={26}
                    className="text-gray-300"
                  />

                  <p className="mt-3 text-[11px] font-bold text-gray-700">
                    Dosya yüklemek için önce görev oluşturulmalı
                  </p>

                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Dosyalar ilgili göreve bağlanarak proje içinde saklanır.
                  </p>

                </div>
              ) : (
                <>
                  <form
                    onSubmit={
                      handleUploadPdf
                    }
                    className="mt-5 grid gap-3 rounded-[18px] border border-gray-100 bg-gray-50/45 p-4 lg:grid-cols-[0.8fr_1fr_1.3fr_auto] lg:items-end"
                  >

                    <label className="block">

                      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Görev
                      </span>

                      <select
                        value={
                          selectedFileTaskId
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedFileTaskId(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[10px] outline-none focus:border-gray-400"
                      >
                        {tasks.map(
                          (task) => (
                            <option
                              key={
                                task.id
                              }
                              value={
                                task.id
                              }
                            >
                              {
                                task.title
                              }
                            </option>
                          )
                        )}
                      </select>

                    </label>

                    <label className="block">

                      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        PDF Dosyası
                      </span>

                      <input
                        id="project-pdf-input"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(
                          event
                        ) =>
                          setSelectedPdf(
                            event.target
                              .files?.[0] ??
                              null
                          )
                        }
                        className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-[9px] text-[9px] text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-[9px] file:font-bold file:text-white"
                      />

                    </label>

                    <label className="block">

                      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Açıklama
                      </span>

                      <input
                        value={
                          uploadDescription
                        }
                        onChange={(
                          event
                        ) =>
                          setUploadDescription(
                            event.target.value
                          )
                        }
                        placeholder="Dosyanın ne içerdiğini yazın..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[10px] outline-none focus:border-gray-400"
                      />

                    </label>

                    <button
                      type="submit"
                      disabled={
                        uploadingPdf
                      }
                      className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-black px-4 text-[10px] font-bold text-white disabled:opacity-40"
                    >
                      <Upload
                        size={13}
                      />
                      {uploadingPdf
                        ? "Yükleniyor..."
                        : "Yükle"}
                    </button>

                    {fileError && (
                      <p className="text-[9px] font-medium text-red-500 lg:col-span-4">
                        {
                          fileError
                        }
                      </p>
                    )}

                  </form>

                  <div className="mt-5 overflow-hidden rounded-[18px] border border-gray-100">

                    {Object.values(
                      attachments
                    ).flat().length ===
                    0 ? (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">

                        <FileText
                          size={24}
                          className="text-gray-300"
                        />

                        <p className="mt-3 text-[11px] font-bold text-gray-700">
                          Henüz PDF yüklenmedi
                        </p>

                      </div>
                    ) : (
                      tasks.flatMap(
                        (task) =>
                          (
                            attachments[
                              task.id
                            ] ?? []
                          ).map(
                            (
                              attachment
                            ) => (
                              <div
                                key={
                                  attachment.id
                                }
                                className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-0 lg:grid-cols-[1.15fr_1.4fr_0.8fr_auto] lg:items-center"
                              >

                                <div className="flex min-w-0 items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                    <FileText
                                      size={15}
                                    />
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
                                      {
                                        attachment.originalFileName
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-[8px] font-medium text-gray-400">
                                      {
                                        task.title
                                      }
                                    </p>

                                  </div>

                                </div>

                                <div>

                                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                    Açıklama
                                  </p>

                                  <p className="mt-1 text-[10px] leading-4 text-gray-600">
                                    {attachmentDescriptions[
                                      attachment.id
                                    ] ||
                                      "Açıklama bulunamadı."}
                                  </p>

                                </div>

                                <div>

                                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                    Yükleyen
                                  </p>

                                  <p className="mt-1 text-[10px] font-semibold text-gray-600">
                                    {
                                      attachment.uploadedByUserName
                                    }
                                  </p>

                                  <p className="mt-0.5 text-[8px] text-gray-400">
                                    {formatDate(
                                      attachment.createdAt
                                    )}
                                  </p>

                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadAttachment(
                                      task.id,
                                      attachment
                                    )
                                  }
                                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[9px] font-bold text-gray-600 transition hover:bg-gray-50"
                                >
                                  <Download
                                    size={12}
                                  />
                                  İndir
                                </button>

                              </div>
                            )
                          )
                      )
                    )}

                  </div>
                </>
              )}

            </div>
          )}

        </section>

        {/* FLOATING PROJECT CHAT */}

        {chatOpen && (
          <section className="fixed bottom-5 right-5 z-[90] flex h-[600px] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-gray-500" />
                  <h2 className="truncate text-[14px] font-bold text-gray-900">
                    Proje Mesajları
                  </h2>
                </div>

                <p className="mt-1 truncate text-[10px] text-gray-400">
                  {project.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Mesajları kapat"
              >
                <X size={15} />
              </button>
            </div>

            <div className="border-b border-gray-100 px-4 py-3">
              <select
                value={recipientUserId || ""}
                onChange={(event) =>
                  setRecipientUserId(
                    event.target.value || null
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-gray-700 outline-none focus:border-gray-400"
              >
                <option value="">
                  Tüm Proje
                </option>

                {members
                  .filter(
                    (member) =>
                      member.userId !== currentUserId
                  )
                  .map((member) => (
                    <option
                      key={member.userId}
                      value={member.userId}
                    >
                      Özel: {getMemberName(member)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/40 px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle size={24} className="text-gray-300" />
                  <p className="mt-3 text-[11px] font-semibold text-gray-500">
                    Henüz proje mesajı yok.
                  </p>
                  <p className="mt-1 max-w-[240px] text-[9px] leading-4 text-gray-400">
                    Proje geneline veya ekipten bir kişiye özel mesaj gönderebilirsiniz.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.senderUserId.toLowerCase() ===
                    currentUserId.toLowerCase();

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        mine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[16px] px-3.5 py-3 ${
                          mine
                            ? "bg-gray-950 text-white"
                            : "border border-gray-100 bg-white text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold ${
                              mine
                                ? "text-white/70"
                                : "text-gray-500"
                            }`}
                          >
                            {message.senderName}
                          </span>

                          {message.recipientUserId && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[8px] ${
                                mine
                                  ? "bg-white/10 text-white/70"
                                  : "bg-gray-50 text-gray-400"
                              }`}
                            >
                              Özel
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-[18px]">
                          {message.content}
                        </p>

                        <p
                          className={`mt-2 text-right text-[8px] ${
                            mine
                              ? "text-white/45"
                              : "text-gray-400"
                          }`}
                        >
                          {formatMessageDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4">
              {selectedRecipient && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="truncate text-[9px] font-semibold text-gray-600">
                    Özel mesaj: {getMemberName(selectedRecipient)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setRecipientUserId(null)}
                    className="ml-2 shrink-0 text-gray-400 hover:text-gray-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      if (
                        messageText.trim() &&
                        !sendingMessage
                      ) {
                        handleSendMessage();
                      }
                    }
                  }}
                  rows={2}
                  placeholder={
                    recipientUserId
                      ? "Özel mesajınızı yazın..."
                      : "Proje geneline mesaj yazın..."
                  }
                  className="min-h-[54px] max-h-[110px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[10px] outline-none focus:border-gray-400"
                />

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={
                    sendingMessage ||
                    !messageText.trim()
                  }
                  className="flex h-[54px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Send size={15} />
                </button>
              </div>

              {messageError && (
                <p className="mt-2 text-[9px] font-medium text-red-500">
                  {messageError}
                </p>
              )}
            </div>
          </section>
        )}

      </div>

      {/* ADD MEMBER */}

      {showMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/15 px-4 backdrop-blur-[1px]">

          <div className="w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Projeye Üye Ekle
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowMemberModal(
                    false
                  )
                }
              >
                <X
                  size={17}
                />
              </button>

            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              Yalnızca {
                project.departmentName
              } departmanındaki kullanıcılar listelenir. Rol seçimi yapılmaz; eklenen kişi standart proje üyesi olur.
            </p>

            <form
              onSubmit={
                handleAddMember
              }
              className="mt-5 space-y-4"
            >

              <select
                value={
                  selectedMemberUserId
                }
                onChange={(
                  event
                ) =>
                  setSelectedMemberUserId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >

                <option value="">
                  Kullanıcı seçin
                </option>

                {selectableUsers.map(
                  (
                    user
                  ) => (
                    <option
                      key={
                        user.id
                      }
                      value={
                        user.id
                      }
                    >
                      {getAvailableName(
                        user
                      )}{" "}
                      —{" "}
                      {
                        user.email
                      }
                    </option>
                  )
                )}

              </select>


              {memberError && (
                <p className="text-[10px] text-red-500">
                  {
                    memberError
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  addingMember ||
                  !selectedMemberUserId
                }
                className="w-full rounded-xl bg-black py-3 text-[11px] font-bold text-white disabled:opacity-40"
              >
                {addingMember
                  ? "Ekleniyor..."
                  : "Kişiyi Ekle"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* TASK MODAL */}

      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/15 px-4 backdrop-blur-[1px]">

          <div className="w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl dark:border dark:border-white/10 dark:bg-[#0b1424] dark:text-white">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Yeni Görev
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowTaskModal(
                    false
                  )
                }
              >
                <X
                  size={17}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleCreateTask
              }
              className="mt-5 space-y-4"
            >

              <input
                value={
                  taskTitle
                }
                onChange={(
                  event
                ) =>
                  setTaskTitle(
                    event.target.value
                  )
                }
                placeholder="Görev başlığı"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              />

              <textarea
                value={
                  taskDescription
                }
                onChange={(
                  event
                ) =>
                  setTaskDescription(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Görev açıklaması"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              />

              <div className="grid grid-cols-2 gap-3">

                <select
                  value={
                    taskPriority
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskPriority(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="1">
                    Düşük
                  </option>

                  <option value="2">
                    Orta
                  </option>

                  <option value="3">
                    Yüksek
                  </option>

                  <option value="4">
                    Kritik
                  </option>
                </select>

                <input
                  type="date"
                  value={
                    taskDueDate
                  }
                  min={
                    project.startDate
                      ? project.startDate.substring(
                          0,
                          10
                        )
                      : undefined
                  }
                  max={
                    project.endDate
                      ? project.endDate.substring(
                          0,
                          10
                        )
                      : undefined
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskDueDate(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />

              </div>

              <select
                value={
                  assignedUserId
                }
                onChange={(
                  event
                ) =>
                  setAssignedUserId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >

                <option value="">
                  Atanacak kişi seçilmedi
                </option>

                {members.map(
                  (
                    member
                  ) => (
                    <option
                      key={
                        member.userId
                      }
                      value={
                        member.userId
                      }
                    >
                      {getMemberName(
                        member
                      )}
                    </option>
                  )
                )}

              </select>

              {taskPriority === "4" && assignedUserId && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
                  Kritik görev olarak seçildi. Görev oluşturulduğunda atanan kişiye “Kritik görev eklendi, dikkat ediniz.” bildirimi gönderilir.
                </div>
              )}

              {taskError && (
                <p className="text-[10px] text-red-500">
                  {
                    taskError
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  creatingTask
                }
                className="w-full rounded-xl bg-black py-3 text-[11px] font-bold text-white disabled:opacity-40"
              >
                {creatingTask
                  ? "Oluşturuluyor..."
                  : "Görevi Oluştur"}
              </button>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}