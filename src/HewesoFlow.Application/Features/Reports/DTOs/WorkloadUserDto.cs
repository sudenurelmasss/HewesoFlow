namespace HewesoFlow.Application.Features.Reports.DTOs;

public class WorkloadUserDto
{
    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string? DepartmentName { get; set; }

    public int TotalTasks { get; set; }

    public int TodoTasks { get; set; }

    public int InProgressTasks { get; set; }

    public int InReviewTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }
}