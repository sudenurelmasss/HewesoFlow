namespace HewesoFlow.Api.Entities;

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Guid? AssignedByUserId { get; set; }

    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;

    public Role Role { get; set; } = null!;

    public User? AssignedByUser { get; set; }
}