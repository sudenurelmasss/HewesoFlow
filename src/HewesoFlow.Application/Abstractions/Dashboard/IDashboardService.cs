using HewesoFlow.Application.Features.Dashboard.DTOs;

namespace HewesoFlow.Application.Abstractions.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}