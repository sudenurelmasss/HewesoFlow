namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class UpdateChecklistItemRequestDto
{
    public string? Title { get; set; }

    public bool IsCompleted { get; set; }

    public int? SortOrder { get; set; }
}