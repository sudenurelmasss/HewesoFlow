using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectMembers.DTOs;

public class AddProjectMemberRequestDto
{
    public Guid ProjectId { get; set; }

    public Guid UserId { get; set; }

    public ProjectMemberRole Role { get; set; }
}