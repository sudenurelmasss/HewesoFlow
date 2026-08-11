namespace HewesoFlow.Domain.Entities;

public class Tag : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<ProjectTaskTag> TaskTags { get; set; }
        = new List<ProjectTaskTag>();
}