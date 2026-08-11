using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectMembers.DTOs;

public class ProjectMemberResponseDto
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public Guid UserId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public ProjectMemberRole Role { get; set; }

    public DateTime JoinedAt { get; set; }

    public bool IsActive { get; set; }
}