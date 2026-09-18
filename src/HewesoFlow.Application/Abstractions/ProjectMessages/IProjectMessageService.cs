using HewesoFlow.Application.Features.ProjectMessages.DTOs;

namespace HewesoFlow.Application.Abstractions.ProjectMessages;

public interface IProjectMessageService
{
    Task<ProjectMessageDto> CreateAsync(
        Guid projectId,
        CreateProjectMessageRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectMessageDto>> GetAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}