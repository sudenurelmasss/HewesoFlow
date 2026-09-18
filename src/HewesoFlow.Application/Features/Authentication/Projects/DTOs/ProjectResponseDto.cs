using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.Projects.DTOs;

public class ProjectResponseDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } =
        string.Empty;

    public string Description { get; set; } =
        string.Empty;

    public Guid DepartmentId { get; set; }

    public string DepartmentName { get; set; } =
        string.Empty;

    public Guid ProjectManagerId { get; set; }

    public string ProjectManagerName { get; set; } =
        string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public ProjectStatus Status { get; set; }

    public bool RequiresMemberApproval { get; set; }

    public DateTime? CompletionRequestedAt { get; set; }

    public DateTime? CompletionApprovedAt { get; set; }

    public Guid? CompletionApprovedByUserId { get; set; }

    public Guid OwnerId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}