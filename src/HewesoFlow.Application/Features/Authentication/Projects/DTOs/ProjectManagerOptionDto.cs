namespace HewesoFlow.Application.Features.Projects.DTOs;

public class ProjectManagerOptionDto
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } =
        string.Empty;

    public string LastName { get; set; } =
        string.Empty;

    public string FullName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public Guid DepartmentId { get; set; }

    public string DepartmentName { get; set; } =
        string.Empty;
}