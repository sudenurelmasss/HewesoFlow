namespace HewesoFlow.Domain.Entities;

public class TaskChecklistItem : BaseEntity
{
    public Guid ProjectTaskId { get; set; }

    public string Title { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public int SortOrder { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ProjectTask ProjectTask { get; set; } = null!;
}