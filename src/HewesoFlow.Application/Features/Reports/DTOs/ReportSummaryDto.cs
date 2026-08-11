namespace HewesoFlow.Application.Features.Reports.DTOs;

public class ReportSummaryDto
{
    public int TotalProjects { get; set; }

    public int TotalTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public int ActiveUsers { get; set; }

    public decimal OverallCompletionPercentage { get; set; }
}