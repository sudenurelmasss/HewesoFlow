using System.Text.RegularExpressions;
using HewesoFlow.Application.Abstractions.Comments;
using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Features.Comments.DTOs;
using HewesoFlow.Application.Features.Notifications.DTOs;
using HewesoFlow.Domain.Enums;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Comments.Services;

public class NotificationCommentService : ICommentService
{
    private readonly CommentService _innerService;
    private readonly INotificationService _notificationService;
    private readonly AppDbContext _context;

    public NotificationCommentService(
        CommentService innerService,
        INotificationService notificationService,
        AppDbContext context)
    {
        _innerService = innerService;
        _notificationService = notificationService;
        _context = context;
    }

    public async Task<CommentResponseDto> CreateAsync(
        Guid projectTaskId,
        CreateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var comment =
            await _innerService.CreateAsync(
                projectTaskId,
                request,
                currentUserId,
                cancellationToken);

        await CreateCommentNotificationsAsync(
            projectTaskId,
            request.Content,
            currentUserId,
            cancellationToken);

        return comment;
    }

    public async Task<IReadOnlyList<CommentResponseDto>> GetByTaskIdAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _innerService.GetByTaskIdAsync(
            projectTaskId,
            currentUserId,
            cancellationToken);
    }

    public async Task<CommentResponseDto> UpdateAsync(
        Guid commentId,
        UpdateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _innerService.UpdateAsync(
            commentId,
            request,
            currentUserId,
            cancellationToken);
    }

    public async Task DeleteAsync(
        Guid commentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await _innerService.DeleteAsync(
            commentId,
            currentUserId,
            cancellationToken);
    }

    private async Task CreateCommentNotificationsAsync(
        Guid projectTaskId,
        string content,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        try
        {
            var task =
                await _context.ProjectTasks
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        item =>
                            item.Id == projectTaskId &&
                            !item.IsDeleted,
                        cancellationToken);

            if (task is null)
            {
                return;
            }

            var currentUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        user =>
                            user.Id == currentUserId &&
                            !user.IsDeleted,
                        cancellationToken);

            var commenterName =
                currentUser is null
                    ? "Bir kullanıcı"
                    : $"{currentUser.FirstName} {currentUser.LastName}"
                        .Trim();

            var mentionedEmails =
                ExtractMentionedEmails(content);

            var mentionedUsers =
                mentionedEmails.Count == 0
                    ? []
                    : await _context.Users
                        .AsNoTracking()
                        .Where(user =>
                            mentionedEmails.Contains(user.Email) &&
                            user.IsActive &&
                            !user.IsDeleted)
                        .ToListAsync(
                            cancellationToken);

            var mentionedUserIds =
                mentionedUsers
                    .Where(user =>
                        user.Id != currentUserId)
                    .Select(user => user.Id)
                    .ToHashSet();

            foreach (var mentionedUser in mentionedUsers)
            {
                if (mentionedUser.Id ==
                    currentUserId)
                {
                    continue;
                }

                await CreateNotificationSafeAsync(
                    new CreateNotificationRequestDto
                    {
                        UserId =
                            mentionedUser.Id,

                        Title =
                            "Bir yorumda sizden bahsedildi",

                        Message =
                            $"{commenterName}, \"{task.Title}\" görevindeki bir yorumda sizden bahsetti.",

                        Type =
                            NotificationType.Mention,

                        RelatedEntityId =
                            task.Id,

                        RelatedEntityType =
                            "Task"
                    },
                    cancellationToken);
            }

            if (task.AssignedUserId.HasValue &&
                task.AssignedUserId.Value != currentUserId &&
                !mentionedUserIds.Contains(
                    task.AssignedUserId.Value))
            {
                await CreateNotificationSafeAsync(
                    new CreateNotificationRequestDto
                    {
                        UserId =
                            task.AssignedUserId.Value,

                        Title =
                            "Görevinize yeni yorum eklendi",

                        Message =
                            $"{commenterName}, \"{task.Title}\" görevine yeni bir yorum ekledi.",

                        Type =
                            NotificationType.CommentAdded,

                        RelatedEntityId =
                            task.Id,

                        RelatedEntityType =
                            "Task"
                    },
                    cancellationToken);
            }
        }
        catch
        {
            // Bildirim tarafındaki bir hata,
            // yorumun başarıyla eklenmesini bozmamalı.
        }
    }

    private static HashSet<string> ExtractMentionedEmails(
        string content)
    {
        var result =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(content))
        {
            return result;
        }

        var matches =
            Regex.Matches(
                content,
                @"@([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})",
                RegexOptions.IgnoreCase);

        foreach (Match match in matches)
        {
            if (match.Groups.Count < 2)
            {
                continue;
            }

            var email =
                match.Groups[1]
                    .Value
                    .Trim();

            if (!string.IsNullOrWhiteSpace(email))
            {
                result.Add(email);
            }
        }

        return result;
    }

    private async Task CreateNotificationSafeAsync(
        CreateNotificationRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(
                request,
                cancellationToken);
        }
        catch
        {
            // Bildirim oluşturulamaması,
            // asıl yorum işlemini başarısız hale getirmez.
        }
    }
}