using HewesoFlow.Application.Features.Reports.DTOs;

namespace HewesoFlow.Application.Abstractions.Reports;

public interface IReportService
{
    Task<ReportSummaryDto> GetSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkloadUserDto>> GetWorkloadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectReportDto>> GetProjectsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}