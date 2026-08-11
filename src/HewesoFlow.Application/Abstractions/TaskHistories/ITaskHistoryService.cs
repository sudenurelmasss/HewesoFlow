using HewesoFlow.Application.Features.TaskHistories.DTOs;

namespace HewesoFlow.Application.Abstractions.TaskHistories;

public interface ITaskHistoryService
{
    Task<IReadOnlyList<TaskHistoryResponseDto>> GetByTaskIdAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaskHistoryResponseDto>> GetRecentAsync(
        Guid currentUserId,
        int count = 10,
        CancellationToken cancellationToken = default);
}