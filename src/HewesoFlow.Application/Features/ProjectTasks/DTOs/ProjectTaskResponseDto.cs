using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class ProjectTaskResponseDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid ProjectId { get; set; }

    public string ProjectName { get; set; } = string.Empty;

    public Guid? AssignedUserId { get; set; }

    public string? AssignedUserFullName { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string CreatedByUserFullName { get; set; } = string.Empty;

    public ProjectTaskStatus Status { get; set; }

    public TaskPriority Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public bool IsOverdue { get; set; }

    public int? DaysRemaining { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}