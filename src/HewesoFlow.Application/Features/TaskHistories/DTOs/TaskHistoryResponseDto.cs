namespace HewesoFlow.Application.Features.TaskHistories.DTOs;

public class TaskHistoryResponseDto
{
    public Guid Id { get; set; }

    public Guid ProjectTaskId { get; set; }

    public string ProjectTaskTitle { get; set; } = string.Empty;

    public Guid UserId { get; set; }

    public string UserFullName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime CreatedOn { get; set; }
}