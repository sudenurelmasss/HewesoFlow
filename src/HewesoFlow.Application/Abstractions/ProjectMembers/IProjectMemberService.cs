using HewesoFlow.Application.Features.ProjectMembers.DTOs;

namespace HewesoFlow.Application.Abstractions.ProjectMembers;

public interface IProjectMemberService
{
    Task<ProjectMemberResponseDto> AddMemberAsync(
        AddProjectMemberRequestDto request,
        Guid ownerId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectMemberResponseDto>> GetMembersAsync(
        Guid projectId,
        Guid ownerId,
        CancellationToken cancellationToken = default);
}