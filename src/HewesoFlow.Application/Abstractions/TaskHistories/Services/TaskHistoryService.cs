using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.TaskHistories;
using HewesoFlow.Application.Features.TaskHistories.DTOs;
using HewesoFlow.Domain.Entities;

namespace HewesoFlow.Persistence.TaskHistories.Services;

public class TaskHistoryService : ITaskHistoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public TaskHistoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TaskHistoryResponseDto>> GetByTaskIdAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await ValidateTaskAccessAsync(
            projectTaskId,
            currentUserId,
            cancellationToken);

        var histories =
            await _unitOfWork.TaskHistories.FindAsync(
                history =>
                    history.ProjectTaskId == projectTaskId &&
                    !history.IsDeleted,
                cancellationToken);

        var result = new List<TaskHistoryResponseDto>();

        foreach (var history in histories
                     .OrderByDescending(history => history.CreatedOn))
        {
            result.Add(
                await MapToResponseAsync(
                    history,
                    cancellationToken));
        }

        return result;
    }

    public async Task<IReadOnlyList<TaskHistoryResponseDto>> GetRecentAsync(
        Guid currentUserId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        if (count < 1)
        {
            count = 10;
        }

        if (count > 50)
        {
            count = 50;
        }

        var ownedProjects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    project.OwnerId == currentUserId &&
                    !project.IsDeleted,
                cancellationToken);

        var memberProjects =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var accessibleProjectIds =
            ownedProjects
                .Select(project => project.Id)
                .Concat(
                    memberProjects.Select(
                        member => member.ProjectId))
                .Distinct()
                .ToHashSet();

        if (accessibleProjectIds.Count == 0)
        {
            return Array.Empty<TaskHistoryResponseDto>();
        }

        var projectTasks =
            await _unitOfWork.ProjectTasks.FindAsync(
                projectTask =>
                    accessibleProjectIds.Contains(
                        projectTask.ProjectId) &&
                    !projectTask.IsDeleted,
                cancellationToken);

        var accessibleTaskIds =
            projectTasks
                .Select(projectTask => projectTask.Id)
                .ToHashSet();

        if (accessibleTaskIds.Count == 0)
        {
            return Array.Empty<TaskHistoryResponseDto>();
        }

        var histories =
            await _unitOfWork.TaskHistories.FindAsync(
                history =>
                    accessibleTaskIds.Contains(
                        history.ProjectTaskId) &&
                    !history.IsDeleted,
                cancellationToken);

        var recentHistories =
            histories
                .OrderByDescending(
                    history => history.CreatedOn)
                .Take(count)
                .ToList();

        var result = new List<TaskHistoryResponseDto>();

        foreach (var history in recentHistories)
        {
            result.Add(
                await MapToResponseAsync(
                    history,
                    cancellationToken));
        }

        return result;
    }

    private async Task ValidateTaskAccessAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                task =>
                    task.Id == projectTaskId &&
                    !task.IsDeleted,
                cancellationToken);

        if (projectTask is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        var userOwnsProject =
            project.OwnerId == currentUserId;

        var userIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == project.Id &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!userOwnsProject &&
            !userIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu görevin işlem geçmişini görüntüleme yetkiniz bulunmamaktadır.");
        }
    }

    private async Task<TaskHistoryResponseDto> MapToResponseAsync(
        TaskHistory history,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                task =>
                    task.Id == history.ProjectTaskId,
                cancellationToken);

        var user =
            await _unitOfWork.Users.FirstOrDefaultAsync(
                user =>
                    user.Id == history.UserId,
                cancellationToken);

        return new TaskHistoryResponseDto
        {
            Id = history.Id,
            ProjectTaskId = history.ProjectTaskId,

            ProjectTaskTitle =
                projectTask?.Title ?? string.Empty,

            UserId = history.UserId,

            UserFullName =
                user is null
                    ? string.Empty
                    : $"{user.FirstName} {user.LastName}",

            Action = history.Action,
            OldValue = history.OldValue,
            NewValue = history.NewValue,
            CreatedOn = history.CreatedOn
        };
    }
}