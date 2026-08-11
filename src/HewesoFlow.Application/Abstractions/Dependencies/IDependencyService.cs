using HewesoFlow.Application.Features.Dependencies.DTOs;

namespace HewesoFlow.Application.Abstractions.Dependencies;

public interface IDependencyService
{
    Task<DependencyDto> AddTaskDependencyAsync(
        Guid taskId,
        Guid dependsOnTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DependencyDto>> GetTaskDependenciesAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task RemoveTaskDependencyAsync(
        Guid taskId,
        Guid dependencyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<DependencyDto> AddProjectDependencyAsync(
        Guid projectId,
        Guid dependsOnProjectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DependencyDto>> GetProjectDependenciesAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task RemoveProjectDependencyAsync(
        Guid projectId,
        Guid dependencyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}