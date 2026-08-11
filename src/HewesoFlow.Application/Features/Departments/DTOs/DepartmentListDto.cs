namespace HewesoFlow.Application.Features.Departments.DTOs;

public class DepartmentListDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? ManagerId { get; set; }

    public string? ManagerName { get; set; }

    public bool IsActive { get; set; }

    public int UserCount { get; set; }

    public int ProjectCount { get; set; }
}