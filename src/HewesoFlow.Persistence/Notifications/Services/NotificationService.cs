using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Features.Notifications.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationDto> CreateAsync(
        CreateNotificationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userExists =
            await _context.Users
                .AsNoTracking()
                .AnyAsync(
                    user =>
                        user.Id == request.UserId &&
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

        if (!userExists)
        {
            throw new InvalidOperationException(
                "Bildirim gönderilecek aktif kullanıcı bulunamadı.");
        }

        var title =
            request.Title?.Trim() ??
            string.Empty;

        var message =
            request.Message?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Bildirim başlığı boş bırakılamaz.");
        }

        if (title.Length > 150)
        {
            throw new ArgumentException(
                "Bildirim başlığı en fazla 150 karakter olabilir.");
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException(
                "Bildirim mesajı boş bırakılamaz.");
        }

        if (message.Length > 1000)
        {
            throw new ArgumentException(
                "Bildirim mesajı en fazla 1000 karakter olabilir.");
        }

        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId =
                    request.UserId,

                Title =
                    title,

                Message =
                    message,

                Type =
                    request.Type,

                IsRead =
                    false,

                ReadAt =
                    null,

                RelatedEntityId =
                    request.RelatedEntityId,

                RelatedEntityType =
                    string.IsNullOrWhiteSpace(
                        request.RelatedEntityType)
                        ? null
                        : request.RelatedEntityType.Trim(),

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _context.Notifications.AddAsync(
            notification,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return Map(notification);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.UserId == currentUserId &&
                !notification.IsDeleted)
            .OrderByDescending(
                notification =>
                    notification.CreatedAt)
            .Select(notification =>
                new NotificationDto
                {
                    Id =
                        notification.Id,

                    Title =
                        notification.Title,

                    Message =
                        notification.Message,

                    Type =
                        notification.Type,

                    IsRead =
                        notification.IsRead,

                    ReadAt =
                        notification.ReadAt,

                    RelatedEntityId =
                        notification.RelatedEntityId,

                    RelatedEntityType =
                        notification.RelatedEntityType,

                    CreatedAt =
                        notification.CreatedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetUnreadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.UserId == currentUserId &&
                !notification.IsRead &&
                !notification.IsDeleted)
            .OrderByDescending(
                notification =>
                    notification.CreatedAt)
            .Select(notification =>
                new NotificationDto
                {
                    Id =
                        notification.Id,

                    Title =
                        notification.Title,

                    Message =
                        notification.Message,

                    Type =
                        notification.Type,

                    IsRead =
                        notification.IsRead,

                    ReadAt =
                        notification.ReadAt,

                    RelatedEntityId =
                        notification.RelatedEntityId,

                    RelatedEntityType =
                        notification.RelatedEntityType,

                    CreatedAt =
                        notification.CreatedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .CountAsync(
                notification =>
                    notification.UserId ==
                        currentUserId &&
                    !notification.IsRead &&
                    !notification.IsDeleted,
                cancellationToken);
    }

    public async Task MarkAsReadAsync(
        Guid notificationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var notification =
            await _context.Notifications
                .FirstOrDefaultAsync(
                    notification =>
                        notification.Id ==
                            notificationId &&
                        notification.UserId ==
                            currentUserId &&
                        !notification.IsDeleted,
                    cancellationToken);

        if (notification is null)
        {
            throw new KeyNotFoundException(
                "Bildirim bulunamadı.");
        }

        if (notification.IsRead)
        {
            return;
        }

        notification.IsRead =
            true;

        notification.ReadAt =
            DateTime.UtcNow;

        notification.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task MarkAllAsReadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var notifications =
            await _context.Notifications
                .Where(notification =>
                    notification.UserId ==
                        currentUserId &&
                    !notification.IsRead &&
                    !notification.IsDeleted)
                .ToListAsync(
                    cancellationToken);

        var now =
            DateTime.UtcNow;

        foreach (var notification in notifications)
        {
            notification.IsRead =
                true;

            notification.ReadAt =
                now;

            notification.UpdatedAt =
                now;
        }

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task DeleteAsync(
        Guid notificationId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var notification =
            await _context.Notifications
                .FirstOrDefaultAsync(
                    notification =>
                        notification.Id ==
                            notificationId &&
                        notification.UserId ==
                            currentUserId &&
                        !notification.IsDeleted,
                    cancellationToken);

        if (notification is null)
        {
            throw new KeyNotFoundException(
                "Bildirim bulunamadı.");
        }

        notification.IsDeleted =
            true;

        notification.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    private static NotificationDto Map(
        Notification notification)
    {
        return new NotificationDto
        {
            Id =
                notification.Id,

            Title =
                notification.Title,

            Message =
                notification.Message,

            Type =
                notification.Type,

            IsRead =
                notification.IsRead,

            ReadAt =
                notification.ReadAt,

            RelatedEntityId =
                notification.RelatedEntityId,

            RelatedEntityType =
                notification.RelatedEntityType,

            CreatedAt =
                notification.CreatedAt
        };
    }
}