using HewesoFlow.Application.Features.Search.DTOs;

namespace HewesoFlow.Application.Abstractions.Search;

public interface IGlobalSearchService
{
    Task<GlobalSearchResponseDto> SearchAsync(
        string query,
        Guid currentUserId,
        int take = 20,
        CancellationToken cancellationToken = default);
}