namespace HewesoFlow.Domain.Enums;

public enum NotificationType
{
    General = 0,

    TaskAssigned = 1,

    TaskStatusChanged = 2,

    CommentAdded = 3,

    Mention = 4,

    DeadlineApproaching = 5,

    ProjectUpdated = 6,

    ProjectMemberAdded = 7,

    ProjectMessage = 8,

    PrivateMessage = 9,

    MeetingAdded = 10
}