namespace HewesoFlow.Application.Features.Users.DTOs;

public class UserListDto
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public Guid? DepartmentId { get; set; }

    public string? Department { get; set; }

    public bool IsActive { get; set; }

    public List<string> Roles { get; set; } =
        new();
}