namespace HewesoFlow.Application.Features.Search.DTOs;

public class GlobalSearchResultDto
{
    public string Type { get; set; } = string.Empty;

    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Subtitle { get; set; }

    public Guid? RelatedId { get; set; }

    public string? RelatedName { get; set; }
}