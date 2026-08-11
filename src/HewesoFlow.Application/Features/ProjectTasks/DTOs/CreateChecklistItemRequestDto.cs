namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class CreateChecklistItemRequestDto
{
    public string Title { get; set; } = string.Empty;

    public int SortOrder { get; set; }
}