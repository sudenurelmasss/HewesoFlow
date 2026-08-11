using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public ProjectStatus Status { get; set; } =
        ProjectStatus.Planning;

    public Guid OwnerId { get; set; }

    public User Owner { get; set; } = null!;

    public Guid? DepartmentId { get; set; }

    public Department? Department { get; set; }

    public ICollection<ProjectMember> Members { get; set; } =
        new List<ProjectMember>();

    public ICollection<ProjectTask> Tasks { get; set; } =
        new List<ProjectTask>();
}