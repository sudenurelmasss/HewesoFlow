using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.Notifications.DTOs;

public class CreateNotificationRequestDto
{
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; }
        = NotificationType.General;

    public Guid? RelatedEntityId { get; set; }

    public string? RelatedEntityType { get; set; }
}