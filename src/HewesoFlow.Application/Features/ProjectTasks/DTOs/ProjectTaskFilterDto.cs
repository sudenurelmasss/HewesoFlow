using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class ProjectTaskFilterDto
{
    public Guid? ProjectId { get; set; }

    public Guid? AssignedUserId { get; set; }

    public ProjectTaskStatus? Status { get; set; }

    public TaskPriority? Priority { get; set; }

    public DateTime? DueBefore { get; set; }

    public DateTime? DueAfter { get; set; }

    public string? Search { get; set; }

    public string? QuickFilter { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}