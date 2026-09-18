using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Domain.Entities;

public class Meeting : BaseEntity
{
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

    public User CreatedByUser { get; set; } =
        null!;

    public Guid? ProjectId { get; set; }

    public Project? Project { get; set; }

    public ICollection<MeetingParticipant> Participants { get; set; } =
        new List<MeetingParticipant>();
}