namespace HewesoFlow.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    // Eski yapı ile uyumluluk için şimdilik tutuluyor.
    public string? Department { get; set; }

    public Guid? DepartmentId { get; set; }

    public Department? DepartmentEntity { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<UserRole> UserRoles { get; set; } =
        new List<UserRole>();
}