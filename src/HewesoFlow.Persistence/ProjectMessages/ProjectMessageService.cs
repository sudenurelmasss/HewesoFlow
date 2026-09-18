using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Abstractions.ProjectMessages;
using HewesoFlow.Application.Features.Notifications.DTOs;
using HewesoFlow.Application.Features.ProjectMessages.DTOs;

using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

using HewesoFlow.Persistence.Contexts;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.ProjectMessages;

public class ProjectMessageService :
    IProjectMessageService
{
    private readonly AppDbContext _context;

    private readonly INotificationService
        _notificationService;

    public ProjectMessageService(
        AppDbContext context,
        INotificationService notificationService)
    {
        _context =
            context;

        _notificationService =
            notificationService;
    }

    /* =========================================================
       CREATE MESSAGE
       ========================================================= */

    public async Task<ProjectMessageDto> CreateAsync(
        Guid projectId,
        CreateProjectMessageRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await GetAccessibleProjectAsync(
                projectId,
                currentUserId,
                cancellationToken);

        var content =
            request.Content?.Trim() ??
            string.Empty;

        if (
            string.IsNullOrWhiteSpace(
                content)
        )
        {
            throw new ArgumentException(
                "Mesaj boş bırakılamaz.");
        }

        if (
            content.Length >
            3000
        )
        {
            throw new ArgumentException(
                "Mesaj en fazla 3000 karakter olabilir.");
        }

        /* =====================================================
           PRIVATE MESSAGE VALIDATION
           ===================================================== */

        if (
            request.RecipientUserId.HasValue
        )
        {
            var recipientAllowed =
                await IsProjectParticipantAsync(
                    project,
                    request.RecipientUserId.Value,
                    cancellationToken);

            if (
                !recipientAllowed
            )
            {
                throw new InvalidOperationException(
                    "Özel mesaj yalnızca proje içerisindeki kullanıcıya gönderilebilir.");
            }

            if (
                request.RecipientUserId.Value ==
                currentUserId
            )
            {
                throw new InvalidOperationException(
                    "Kendinize özel mesaj gönderemezsiniz.");
            }
        }

        /* =====================================================
           CREATE
           ===================================================== */

        var message =
            new ProjectMessage
            {
                Id =
                    Guid.NewGuid(),

                ProjectId =
                    project.Id,

                SenderUserId =
                    currentUserId,

                RecipientUserId =
                    request.RecipientUserId,

                Content =
                    content,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _context.ProjectMessages.AddAsync(
            message,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        /* =====================================================
           PRIVATE MESSAGE
           ===================================================== */

        if (
            message.RecipientUserId.HasValue
        )
        {
            /*
             * Özel mesaj yalnızca
             * doğrudan alıcıya gider.
             *
             * Admin bu bildirimi almaz.
             */
            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId =
                        message.RecipientUserId.Value,

                    Title =
                        $"{project.Name} - Özel mesaj",

                    Message =
                        content,

                    Type =
                        NotificationType.PrivateMessage,

                    RelatedEntityId =
                        project.Id,

                    RelatedEntityType =
                        "Project"
                },
                cancellationToken);
        }

        /* =====================================================
           GROUP MESSAGE
           ===================================================== */

        else
        {
            /*
             * Toplu proje mesajlarında:
             *
             * - proje üyeleri
             * - Project Manager
             * - proje sahibi
             * - Admin
             *
             * bildirim alabilir.
             */
            var recipients =
                await GetGroupRecipientsAsync(
                    project,
                    currentUserId,
                    cancellationToken);

            /*
             * Admin kullanıcılarını ayrıca
             * tespit ediyoruz.
             *
             * Çünkü Admin bildirimi diğer
             * kullanıcıların bildiriminden
             * daha detaylı olacak.
             */
            var adminIds =
                await GetAdminIdsAsync(
                    cancellationToken);

            /*
             * Admin bildiriminde departman
             * ismi gösterilecek.
             */
            var departmentName =
                await _context.Departments
                    .AsNoTracking()
                    .Where(
                        department =>
                            department.Id ==
                                project.DepartmentId &&
                            !department.IsDeleted)
                    .Select(
                        department =>
                            department.Name)
                    .FirstOrDefaultAsync(
                        cancellationToken)
                ??
                "Departman";

            foreach (
                var userId
                in recipients
            )
            {
                var isAdminRecipient =
                    adminIds.Contains(
                        userId);

                /*
                 * ADMIN:
                 *
                 * Departman
                 * Proje
                 * Mesaj içeriği
                 *
                 * görecek.
                 */
                var notificationTitle =
                    isAdminRecipient
                        ? "Toplu proje mesajı"
                        : $"{project.Name} - Proje mesajı";

                var notificationMessage =
                    isAdminRecipient
                        ? $"Departman: {departmentName} | Proje: {project.Name} | Mesaj: {content}"
                        : content;

                await _notificationService.CreateAsync(
                    new CreateNotificationRequestDto
                    {
                        UserId =
                            userId,

                        Title =
                            notificationTitle,

                        Message =
                            notificationMessage,

                        Type =
                            NotificationType.ProjectMessage,

                        RelatedEntityId =
                            project.Id,

                        RelatedEntityType =
                            "Project"
                    },
                    cancellationToken);
            }
        }

        return await MapAsync(
            message,
            cancellationToken);
    }

    /* =========================================================
       GET MESSAGES
       ========================================================= */

    public async Task<IReadOnlyList<ProjectMessageDto>> GetAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await GetAccessibleProjectAsync(
                projectId,
                currentUserId,
                cancellationToken);

        var messages =
            await _context.ProjectMessages
                .AsNoTracking()
                .Where(
                    message =>
                        message.ProjectId ==
                            project.Id &&

                        !message.IsDeleted &&

                        (
                            /*
                             * TOPLU:
                             *
                             * Admin ve proje
                             * katılımcıları görebilir.
                             */
                            !message.RecipientUserId.HasValue
                            ||

                            /*
                             * ÖZEL:
                             *
                             * yalnızca gönderen
                             * veya alıcı.
                             */
                            message.SenderUserId ==
                                currentUserId
                            ||
                            message.RecipientUserId ==
                                currentUserId
                        ))
                .OrderBy(
                    message =>
                        message.CreatedAt)
                .ToListAsync(
                    cancellationToken);

        var result =
            new List<ProjectMessageDto>();

        foreach (
            var message
            in messages
        )
        {
            result.Add(
                await MapAsync(
                    message,
                    cancellationToken));
        }

        return result;
    }

    /* =========================================================
       ACCESS PROJECT
       ========================================================= */

    private async Task<Project>
        GetAccessibleProjectAsync(
            Guid projectId,
            Guid currentUserId,
            CancellationToken cancellationToken)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (
            project is null
        )
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        /*
         * Admin bütün proje grup
         * konuşmalarına erişebilir.
         */
        if (
            await IsAdminAsync(
                currentUserId,
                cancellationToken)
        )
        {
            return project;
        }

        /*
         * Diğer kullanıcılar yalnızca
         * proje katılımcısıysa.
         */
        if (
            await IsProjectParticipantAsync(
                project,
                currentUserId,
                cancellationToken)
        )
        {
            return project;
        }

        throw new UnauthorizedAccessException(
            "Bu projenin mesajlarını görüntüleme yetkiniz bulunmuyor.");
    }

    /* =========================================================
       PROJECT PARTICIPANT
       ========================================================= */

    private async Task<bool>
        IsProjectParticipantAsync(
            Project project,
            Guid userId,
            CancellationToken cancellationToken)
    {
        /*
         * Proje sahibi.
         */
        if (
            project.OwnerId ==
            userId
        )
        {
            return true;
        }

        /*
         * Project Manager.
         */
        if (
            project.ProjectManagerId ==
            userId
        )
        {
            return true;
        }

        /*
         * Team Member.
         */
        return await _context.ProjectMembers
            .AsNoTracking()
            .AnyAsync(
                member =>
                    member.ProjectId ==
                        project.Id &&

                    member.UserId ==
                        userId &&

                    member.IsActive &&

                    !member.IsDeleted,
                cancellationToken);
    }

    /* =========================================================
       GROUP RECIPIENTS
       ========================================================= */

    private async Task<List<Guid>>
        GetGroupRecipientsAsync(
            Project project,
            Guid senderUserId,
            CancellationToken cancellationToken)
    {
        /*
         * Proje üyeleri.
         */
        var ids =
            await _context.ProjectMembers
                .AsNoTracking()
                .Where(
                    member =>
                        member.ProjectId ==
                            project.Id &&

                        member.IsActive &&

                        !member.IsDeleted)
                .Select(
                    member =>
                        member.UserId)
                .ToListAsync(
                    cancellationToken);

        /*
         * Project Manager.
         */
        ids.Add(
            project.ProjectManagerId);

        /*
         * Proje sahibi.
         */
        ids.Add(
            project.OwnerId);

        /*
         * Admin kullanıcıları.
         *
         * Admin yalnızca TOPLU
         * proje mesajlarından
         * bildirim alır.
         */
        var adminIds =
            await GetAdminIdsAsync(
                cancellationToken);

        ids.AddRange(
            adminIds);

        /*
         * Mesajı atan kullanıcıya
         * kendi mesajı için bildirim
         * göndermiyoruz.
         */
        return ids
            .Where(
                id =>
                    id !=
                    senderUserId)
            .Distinct()
            .ToList();
    }

    /* =========================================================
       GET ADMIN IDS
       ========================================================= */

    private async Task<HashSet<Guid>>
        GetAdminIdsAsync(
            CancellationToken cancellationToken)
    {
        var adminIds =
            await _context.UserRoles
                .AsNoTracking()
                .Where(
                    userRole =>

                        userRole.IsActive &&

                        !userRole.IsDeleted &&

                        userRole.Role.Name ==
                            "Admin" &&

                        userRole.Role.IsActive &&

                        !userRole.Role.IsDeleted &&

                        userRole.User.IsActive &&

                        !userRole.User.IsDeleted)
                .Select(
                    userRole =>
                        userRole.UserId)
                .Distinct()
                .ToListAsync(
                    cancellationToken);

        return adminIds
            .ToHashSet();
    }

    /* =========================================================
       IS ADMIN
       ========================================================= */

    private async Task<bool>
        IsAdminAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                userRole =>

                    userRole.UserId ==
                        userId &&

                    userRole.IsActive &&

                    !userRole.IsDeleted &&

                    userRole.Role.Name ==
                        "Admin" &&

                    userRole.Role.IsActive &&

                    !userRole.Role.IsDeleted,
                cancellationToken);
    }

    /* =========================================================
       MAP
       ========================================================= */

    private async Task<ProjectMessageDto>
        MapAsync(
            ProjectMessage message,
            CancellationToken cancellationToken)
    {
        var sender =
            await _context.Users
                .AsNoTracking()
                .Where(
                    user =>
                        user.Id ==
                            message.SenderUserId)
                .Select(
                    user =>
                        user.FirstName +
                        " " +
                        user.LastName)
                .FirstOrDefaultAsync(
                    cancellationToken)
            ??
            "Kullanıcı";

        string? recipient =
            null;

        if (
            message.RecipientUserId.HasValue
        )
        {
            recipient =
                await _context.Users
                    .AsNoTracking()
                    .Where(
                        user =>
                            user.Id ==
                                message.RecipientUserId.Value)
                    .Select(
                        user =>
                            user.FirstName +
                            " " +
                            user.LastName)
                    .FirstOrDefaultAsync(
                        cancellationToken);
        }

        return new ProjectMessageDto
        {
            Id =
                message.Id,

            ProjectId =
                message.ProjectId,

            SenderUserId =
                message.SenderUserId,

            SenderName =
                sender.Trim(),

            RecipientUserId =
                message.RecipientUserId,

            RecipientName =
                recipient?.Trim(),

            Content =
                message.Content,

            CreatedAt =
                message.CreatedAt
        };
    }
}