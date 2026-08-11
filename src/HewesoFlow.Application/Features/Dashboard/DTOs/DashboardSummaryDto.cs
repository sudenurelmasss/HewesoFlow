namespace HewesoFlow.Application.Features.Dashboard.DTOs;

public class DashboardSummaryDto
{
    public int TotalProjects { get; set; }

    public int TotalTasks { get; set; }

    public int TodoTasks { get; set; }

    public int InProgressTasks { get; set; }

    public int InReviewTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public int AssignedToMeTasks { get; set; }

    public decimal CompletionPercentage { get; set; }
}