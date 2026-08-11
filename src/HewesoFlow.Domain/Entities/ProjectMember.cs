using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Domain.Entities;

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Guid UserId { get; set; }

    public ProjectMemberRole Role { get; set; } = ProjectMemberRole.Member;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public Project Project { get; set; } = null!;

    public User User { get; set; } = null!;
}