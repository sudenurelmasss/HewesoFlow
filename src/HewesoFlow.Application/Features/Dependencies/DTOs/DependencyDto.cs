namespace HewesoFlow.Application.Features.Dependencies.DTOs;

public class DependencyDto
{
    public Guid Id { get; set; }

    public Guid SourceId { get; set; }

    public Guid DependsOnId { get; set; }

    public string DependsOnName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}