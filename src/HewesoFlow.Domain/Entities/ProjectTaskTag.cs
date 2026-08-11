namespace HewesoFlow.Domain.Entities;

public class ProjectTaskTag : BaseEntity
{
    public Guid ProjectTaskId { get; set; }

    public Guid TagId { get; set; }

    public ProjectTask ProjectTask { get; set; } = null!;

    public Tag Tag { get; set; } = null!;
}