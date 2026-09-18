using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.Meetings;

public class CreateMeetingRequestDto
{
    public string Title { get; set; } =
        string.Empty;

    public string? Description { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public MeetingScopeType ScopeType { get; set; }

    public List<Guid> DepartmentIds { get; set; } =
        new();

    public Guid? ProjectId { get; set; }
}

public class MeetingDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } =
        string.Empty;

    public string? Description { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public MeetingScopeType ScopeType { get; set; }

    public string AudienceLabel { get; set; } =
        string.Empty;

    public string RoomName { get; set; } =
        string.Empty;

    public Guid CreatedByUserId { get; set; }

    public string CreatedByUserName { get; set; } =
        string.Empty;

    public Guid? ProjectId { get; set; }

    public string? ProjectName { get; set; }

    public int ParticipantCount { get; set; }

    public bool CanJoin { get; set; }

    public DateTime CreatedAt { get; set; }
}