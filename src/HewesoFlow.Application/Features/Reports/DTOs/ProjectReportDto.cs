namespace HewesoFlow.Application.Features.Reports.DTOs;

public class ProjectReportDto
{
    public Guid ProjectId { get; set; }

    public string ProjectName { get; set; } = string.Empty;

    public string? DepartmentName { get; set; }

    public int TotalTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public decimal CompletionPercentage { get; set; }

    public int MemberCount { get; set; }
}