using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Abstractions.ProjectTasks;

using HewesoFlow.Application.Features.Notifications.DTOs;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;

using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.ProjectTasks.Services;

public class NotificationProjectTaskService :
    IProjectTaskService
{
    private readonly ProjectTaskService
        _innerService;

    private readonly INotificationService
        _notificationService;

    public NotificationProjectTaskService(
        ProjectTaskService innerService,
        INotificationService notificationService)
    {
        _innerService =
            innerService;

        _notificationService =
            notificationService;
    }

    /* =========================================================
       CREATE
       ========================================================= */

    public async Task<ProjectTaskResponseDto> CreateAsync(
        CreateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var result =
            await _innerService.CreateAsync(
                request,
                currentUserId,
                cancellationToken);

        /*
         * Yeni görev bildirimi yalnızca
         * görevin atandığı kullanıcıya gider.
         *
         * Admin'e herhangi bir görev
         * bildirimi gönderilmez.
         */
        if (
            result.AssignedUserId.HasValue &&
            result.AssignedUserId.Value !=
                currentUserId
        )
        {
            var isCritical =
                result.Priority ==
                TaskPriority.Critical;

            await CreateNotificationSafeAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        result.AssignedUserId.Value,

                    Title =
                        isCritical
                            ? "Kritik görev eklendi"
                            : "Yeni görev atandı",

                    Message =
                        isCritical
                            ? $"\"{result.Title}\" görevi size kritik öncelikle atandı."
                            : $"\"{result.Title}\" görevi size atandı.",

                    Type =
                        NotificationType.TaskAssigned,

                    RelatedEntityId =
                        result.Id,

                    RelatedEntityType =
                        "Task"
                },
                cancellationToken);
        }

        return result;
    }

    /* =========================================================
       GET ALL
       ========================================================= */

    public async Task<IReadOnlyList<ProjectTaskResponseDto>>
        GetAllAsync(
            ProjectTaskFilterDto filter,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        return await _innerService.GetAllAsync(
            filter,
            currentUserId,
            cancellationToken);
    }

    /* =========================================================
       GET BY ID
       ========================================================= */

    public async Task<ProjectTaskResponseDto>
        GetByIdAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        return await _innerService.GetByIdAsync(
            taskId,
            currentUserId,
            cancellationToken);
    }

    /* =========================================================
       UPDATE
       ========================================================= */

    public async Task<ProjectTaskResponseDto> UpdateAsync(
        Guid taskId,
        UpdateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var oldTask =
            await _innerService.GetByIdAsync(
                taskId,
                currentUserId,
                cancellationToken);

        var result =
            await _innerService.UpdateAsync(
                taskId,
                request,
                currentUserId,
                cancellationToken);

        var oldAssignedUserId =
            oldTask.AssignedUserId;

        var newAssignedUserId =
            result.AssignedUserId;

        /*
         * Görev başka kullanıcıya
         * atandıysa yeni kullanıcı
         * bildirim alır.
         */
        if (
            oldAssignedUserId !=
                newAssignedUserId &&

            newAssignedUserId.HasValue &&

            newAssignedUserId.Value !=
                currentUserId
        )
        {
            var isCritical =
                result.Priority ==
                TaskPriority.Critical;

            await CreateNotificationSafeAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        newAssignedUserId.Value,

                    Title =
                        isCritical
                            ? "Kritik görev eklendi"
                            : "Görev size atandı",

                    Message =
                        isCritical
                            ? $"\"{result.Title}\" görevi size kritik öncelikle atandı."
                            : $"\"{result.Title}\" görevi size atandı.",

                    Type =
                        NotificationType.TaskAssigned,

                    RelatedEntityId =
                        result.Id,

                    RelatedEntityType =
                        "Task"
                },
                cancellationToken);
        }

        return result;
    }

    /* =========================================================
       UPDATE STATUS
       ========================================================= */

    public async Task<ProjectTaskResponseDto> UpdateStatusAsync(
        Guid taskId,
        UpdateProjectTaskStatusRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var oldTask =
            await _innerService.GetByIdAsync(
                taskId,
                currentUserId,
                cancellationToken);

        var result =
            await _innerService.UpdateStatusAsync(
                taskId,
                request,
                currentUserId,
                cancellationToken);

        /*
         * Durumu değiştiren kişi dışında
         * görevin atanmış olduğu kişi
         * durum değişikliğini görebilir.
         */
        if (
            oldTask.Status !=
                result.Status &&

            result.AssignedUserId.HasValue &&

            result.AssignedUserId.Value !=
                currentUserId
        )
        {
            await CreateNotificationSafeAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        result.AssignedUserId.Value,

                    Title =
                        "Görev durumu değişti",

                    Message =
                        $"\"{result.Title}\" görevinin durumu {GetStatusText(result.Status)} olarak değiştirildi.",

                    Type =
                        NotificationType.TaskStatusChanged,

                    RelatedEntityId =
                        result.Id,

                    RelatedEntityType =
                        "Task"
                },
                cancellationToken);
        }

        /*
         * NOT:
         *
         * Buradan Admin'e hiçbir
         * bildirim gönderilmiyor.
         *
         * Görev tamamlandı bildiriminin
         * Project Manager'a gönderilmesini
         * sonraki dosyada proje bilgisi
         * üzerinden ekleyeceğiz.
         */

        return result;
    }

    /* =========================================================
       DELETE
       ========================================================= */

    public async Task DeleteAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await _innerService.DeleteAsync(
            taskId,
            currentUserId,
            cancellationToken);
    }

    /* =========================================================
       SAFE NOTIFICATION
       ========================================================= */

    private async Task CreateNotificationSafeAsync(
        CreateNotificationRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                request,
                cancellationToken);
        }
        catch
        {
            /*
             * Bildirim hatası ana görev
             * işlemini bozmasın.
             */
        }
    }

    /* =========================================================
       STATUS TEXT
       ========================================================= */

    private static string GetStatusText(
        ProjectTaskStatus status)
    {
        return status switch
        {
            ProjectTaskStatus.Todo =>
                "Yapılacak",

            ProjectTaskStatus.InProgress =>
                "Devam Ediyor",

            ProjectTaskStatus.InReview =>
                "İncelemede",

            ProjectTaskStatus.Done =>
                "Tamamlandı",

            _ =>
                status.ToString()
        };
    }
}