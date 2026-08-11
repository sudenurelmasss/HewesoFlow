namespace HewesoFlow.Domain.Entities;

public class ProjectTaskDependency : BaseEntity
{
    public Guid ProjectTaskId { get; set; }

    public Guid DependsOnTaskId { get; set; }

    public ProjectTask ProjectTask { get; set; } = null!;

    public ProjectTask DependsOnTask { get; set; } = null!;
}