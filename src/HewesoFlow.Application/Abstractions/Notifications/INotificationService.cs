using HewesoFlow.Application.Features.Notifications.DTOs;

namespace HewesoFlow.Application.Abstractions.Notifications;

public interface INotificationService
{
    Task<NotificationDto> CreateAsync(
        CreateNotificationRequestDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NotificationDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NotificationDto>> GetUnreadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadCountAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task MarkAsReadAsync(
        Guid notificationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task MarkAllAsReadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid notificationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}