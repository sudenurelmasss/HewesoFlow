namespace HewesoFlow.Application.Features.Projects.DTOs;

public class ProjectSummaryDto
{
    public Guid ProjectId { get; set; }

    public string ProjectName { get; set; } = string.Empty;

    public int TotalTasks { get; set; }

    public int TodoTasks { get; set; }

    public int InProgressTasks { get; set; }

    public int InReviewTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public decimal CompletionPercentage { get; set; }
}