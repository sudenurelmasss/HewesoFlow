namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class ChecklistItemDto
{
    public Guid Id { get; set; }

    public Guid ProjectTaskId { get; set; }

    public string Title { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public int SortOrder { get; set; }

    public DateTime? CompletedAt { get; set; }
}