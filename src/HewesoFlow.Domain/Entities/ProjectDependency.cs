namespace HewesoFlow.Domain.Entities;

public class ProjectDependency : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Guid DependsOnProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public Project DependsOnProject { get; set; } = null!;
}