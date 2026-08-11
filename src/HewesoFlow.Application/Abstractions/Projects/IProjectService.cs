using HewesoFlow.Application.Features.Projects.DTOs;

namespace HewesoFlow.Application.Abstractions.Projects;

public interface IProjectService
{
    Task<ProjectResponseDto> CreateAsync(
        CreateProjectRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectListDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectResponseDto?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectResponseDto?> UpdateAsync(
        UpdateProjectRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProjectSummaryDto?> GetSummaryAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}