namespace HewesoFlow.Domain.Entities;

public class TaskHistory : BaseEntity
{
    public Guid ProjectTaskId { get; set; }

    public Guid UserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public ProjectTask ProjectTask { get; set; } = null!;

    public User User { get; set; } = null!;
}