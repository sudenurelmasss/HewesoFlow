using HewesoFlow.Application.Features.Meetings;

namespace HewesoFlow.Application.Abstractions.Meetings;

public interface IMeetingService
{
    Task<MeetingDto> CreateAsync(
        CreateMeetingRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeetingDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<MeetingDto?> GetByIdAsync(
        Guid meetingId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}