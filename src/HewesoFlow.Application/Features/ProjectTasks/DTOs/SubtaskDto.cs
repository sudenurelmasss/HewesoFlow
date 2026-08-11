using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class SubtaskDto
{
    public Guid Id { get; set; }

    public Guid ParentTaskId { get; set; }

    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? AssignedUserId { get; set; }

    public ProjectTaskStatus Status { get; set; }

    public TaskPriority Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public decimal? EstimatedHours { get; set; }

    public DateTime CreatedAt { get; set; }
}