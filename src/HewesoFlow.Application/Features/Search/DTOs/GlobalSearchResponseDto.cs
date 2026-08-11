namespace HewesoFlow.Application.Features.Search.DTOs;

public class GlobalSearchResponseDto
{
    public string Query { get; set; } = string.Empty;

    public List<GlobalSearchResultDto> Results { get; set; }
        = new();

    public int TotalCount { get; set; }
}