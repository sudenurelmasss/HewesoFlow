using HewesoFlow.Application.Features.ProjectTasks.DTOs;

namespace HewesoFlow.Application.Abstractions.ProjectTasks;

public interface ITaskAdvancedService
{
    Task<SubtaskDto> CreateSubtaskAsync(
        Guid parentTaskId,
        CreateSubtaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SubtaskDto>> GetSubtasksAsync(
        Guid parentTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ChecklistItemDto> CreateChecklistItemAsync(
        Guid taskId,
        CreateChecklistItemRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChecklistItemDto>> GetChecklistAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ChecklistItemDto> UpdateChecklistItemAsync(
        Guid taskId,
        Guid itemId,
        UpdateChecklistItemRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task DeleteChecklistItemAsync(
        Guid taskId,
        Guid itemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<TaskTagDto> AddTagAsync(
        Guid taskId,
        CreateTaskTagRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaskTagDto>> GetTagsAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task RemoveTagAsync(
        Guid taskId,
        Guid tagId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}