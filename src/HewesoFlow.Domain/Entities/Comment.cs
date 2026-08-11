namespace HewesoFlow.Domain.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;

    public Guid ProjectTaskId { get; set; }

    public Guid UserId { get; set; }

    public ProjectTask ProjectTask { get; set; } = null!;

    public User User { get; set; } = null!;
}