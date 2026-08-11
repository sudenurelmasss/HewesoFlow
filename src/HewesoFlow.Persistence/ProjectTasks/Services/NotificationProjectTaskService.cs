using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Features.Notifications.DTOs;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.ProjectTasks.Services;

public class NotificationProjectTaskService : IProjectTaskService
{
    private readonly ProjectTaskService _innerService;
    private readonly INotificationService _notificationService;

    public NotificationProjectTaskService(
        ProjectTaskService innerService,
        INotificationService notificationService)
    {
        _innerService = innerService;
        _notificationService = notificationService;
    }

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

        if (result.AssignedUserId.HasValue &&
            result.AssignedUserId.Value != currentUserId)
        {
            await CreateNotificationSafeAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        result.AssignedUserId.Value,

                    Title =
                        "Yeni görev atandı",

                    Message =
                        $"\"{result.Title}\" görevi size atandı.",

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

    public async Task<IReadOnlyList<ProjectTaskResponseDto>> GetAllAsync(
        ProjectTaskFilterDto filter,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _innerService.GetAllAsync(
            filter,
            currentUserId,
            cancellationToken);
    }

    public async Task<ProjectTaskResponseDto> GetByIdAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _innerService.GetByIdAsync(
            taskId,
            currentUserId,
            cancellationToken);
    }

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

        if (oldAssignedUserId != newAssignedUserId &&
            newAssignedUserId.HasValue &&
            newAssignedUserId.Value != currentUserId)
        {
            await CreateNotificationSafeAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        newAssignedUserId.Value,

                    Title =
                        "Görev size atandı",

                    Message =
                        $"\"{result.Title}\" görevi size atandı.",

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

        if (oldTask.Status != result.Status &&
            result.AssignedUserId.HasValue &&
            result.AssignedUserId.Value != currentUserId)
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

        return result;
    }

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
            // Bildirim oluşturulamaması,
            // asıl görev işlemini başarısız hale getirmemeli.
        }
    }

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