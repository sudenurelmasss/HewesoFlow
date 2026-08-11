using HewesoFlow.Application.Features.ProjectTasks.DTOs;

namespace HewesoFlow.Application.Abstractions.ProjectTasks;

public interface IProjectTaskService
{
    Task<ProjectTaskResponseDto> CreateAsync(
        CreateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectTaskResponseDto>> GetAllAsync(
        ProjectTaskFilterDto filter,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectTaskResponseDto> GetByIdAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectTaskResponseDto> UpdateAsync(
        Guid taskId,
        UpdateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectTaskResponseDto> UpdateStatusAsync(
        Guid taskId,
        UpdateProjectTaskStatusRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}