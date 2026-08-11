namespace HewesoFlow.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? ManagerId { get; set; }

    public User? Manager { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } =
        new List<User>();

    public ICollection<Project> Projects { get; set; } =
        new List<Project>();
}