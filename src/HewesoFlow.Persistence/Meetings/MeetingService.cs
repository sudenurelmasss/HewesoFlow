using HewesoFlow.Application.Abstractions.Meetings;
using HewesoFlow.Application.Features.Meetings;

using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

using HewesoFlow.Persistence.Contexts;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Meetings;

public class MeetingService : IMeetingService
{
    private readonly AppDbContext _context;

    public MeetingService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<MeetingDto> CreateAsync(
        CreateMeetingRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var title =
            request.Title?.Trim() ??
            string.Empty;

        var description =
            request.Description?.Trim();

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Toplantı adı zorunludur.");
        }

        if (title.Length > 160)
        {
            throw new ArgumentException(
                "Toplantı adı en fazla 160 karakter olabilir.");
        }

        if (request.EndDateTime <=
            request.StartDateTime)
        {
            throw new ArgumentException(
                "Toplantı bitiş saati başlangıç saatinden sonra olmalıdır.");
        }

        var roles =
            await _context.UserRoles
                .AsNoTracking()
                .Where(x =>
                    x.UserId == currentUserId &&
                    x.IsActive &&
                    !x.IsDeleted &&
                    x.Role.IsActive &&
                    !x.Role.IsDeleted)
                .Select(x =>
                    x.Role.Name)
                .ToListAsync(
                    cancellationToken);

        var isAdmin =
            roles.Any(x =>
                x.Equals(
                    "Admin",
                    StringComparison.OrdinalIgnoreCase));

        var isProjectManager =
            roles.Any(x =>
                x.Equals(
                    "ProjectManager",
                    StringComparison.OrdinalIgnoreCase));

        if (!isAdmin &&
            !isProjectManager)
        {
            throw new UnauthorizedAccessException(
                "Toplantı oluşturma yetkiniz bulunmuyor.");
        }

        /*
         * ADMIN:
         * Departman bazlı toplantı.
         */
        if (isAdmin &&
            request.ScopeType !=
            MeetingScopeType.Department)
        {
            throw new ArgumentException(
                "Admin toplantıları departman bazlı oluşturmalıdır.");
        }

        /*
         * PROJECT MANAGER:
         * Yalnızca proje bazlı toplantı.
         */
        if (!isAdmin &&
            isProjectManager &&
            request.ScopeType !=
            MeetingScopeType.Project)
        {
            throw new ArgumentException(
                "Project Manager toplantıları proje bazlı oluşturmalıdır.");
        }

        var participantIds =
            new HashSet<Guid>();

        var audienceLabel =
            string.Empty;

        Guid? projectId =
            null;

        /* =====================================================
           ADMIN - DEPARTMAN TOPLANTISI
           ===================================================== */

        if (request.ScopeType ==
            MeetingScopeType.Department)
        {
            var departmentIds =
                request.DepartmentIds
                    .Where(x =>
                        x != Guid.Empty)
                    .Distinct()
                    .ToList();

            if (departmentIds.Count == 0)
            {
                throw new ArgumentException(
                    "En az bir departman seçilmelidir.");
            }

            var departments =
                await _context.Departments
                    .AsNoTracking()
                    .Where(x =>
                        departmentIds.Contains(
                            x.Id) &&
                        !x.IsDeleted)
                    .OrderBy(x =>
                        x.Name)
                    .Select(x =>
                        new
                        {
                            x.Id,
                            x.Name
                        })
                    .ToListAsync(
                        cancellationToken);

            if (departments.Count !=
                departmentIds.Count)
            {
                throw new ArgumentException(
                    "Seçilen departmanlardan biri bulunamadı.");
            }

            /*
             * Seçilen departmanlardaki
             * tüm aktif kullanıcılar.
             */
            var users =
                await _context.Users
                    .AsNoTracking()
                    .Where(x =>
                        x.DepartmentId.HasValue &&
                        departmentIds.Contains(
                            x.DepartmentId.Value) &&
                        x.IsActive &&
                        !x.IsDeleted)
                    .Select(x =>
                        x.Id)
                    .ToListAsync(
                        cancellationToken);

            foreach (var userId in users)
            {
                participantIds.Add(
                    userId);
            }

            audienceLabel =
                string.Join(
                    " + ",
                    departments.Select(
                        x => x.Name));
        }

        /* =====================================================
           PROJECT MANAGER - PROJE TOPLANTISI
           ===================================================== */

        else
        {
            if (!request.ProjectId.HasValue ||
                request.ProjectId ==
                Guid.Empty)
            {
                throw new ArgumentException(
                    "Toplantı için bir proje seçilmelidir.");
            }

            var project =
                await _context.Projects
                    .AsNoTracking()
                    .Where(x =>
                        x.Id ==
                        request.ProjectId.Value &&
                        !x.IsDeleted)
                    .Select(x =>
                        new
                        {
                            x.Id,
                            x.Name,
                            x.ProjectManagerId
                        })
                    .FirstOrDefaultAsync(
                        cancellationToken);

            if (project is null)
            {
                throw new KeyNotFoundException(
                    "Proje bulunamadı.");
            }

            /*
             * PM yalnızca kendisinin yönettiği
             * projede toplantı açabilir.
             */
            if (!isAdmin &&
                project.ProjectManagerId !=
                currentUserId)
            {
                throw new UnauthorizedAccessException(
                    "Yalnızca yöneticisi olduğunuz proje için toplantı oluşturabilirsiniz.");
            }

            var memberIds =
                await _context.ProjectMembers
                    .AsNoTracking()
                    .Where(x =>
                        x.ProjectId ==
                        project.Id &&
                        x.IsActive &&
                        !x.IsDeleted &&
                        x.User.IsActive &&
                        !x.User.IsDeleted)
                    .Select(x =>
                        x.UserId)
                    .ToListAsync(
                        cancellationToken);

            foreach (var memberId in memberIds)
            {
                participantIds.Add(
                    memberId);
            }

            /*
             * Project Manager da toplantının
             * katılımcısı.
             */
            participantIds.Add(
                project.ProjectManagerId);

            projectId =
                project.Id;

            audienceLabel =
                project.Name;
        }

        /*
         * Oluşturan kişi kesinlikle
         * toplantıya eklenir.
         */
        participantIds.Add(
            currentUserId);

        var meeting =
            new Meeting
            {
                Id =
                    Guid.NewGuid(),

                Title =
                    title,

                Description =
                    string.IsNullOrWhiteSpace(
                        description)
                        ? null
                        : description,

                StartDateTime =
                    request.StartDateTime,

                EndDateTime =
                    request.EndDateTime,

                ScopeType =
                    request.ScopeType,

                AudienceLabel =
                    audienceLabel,

                /*
                 * Her toplantının benzersiz
                 * Jitsi odası.
                 */
                RoomName =
                    $"hewesoflow-{Guid.NewGuid():N}",

                CreatedByUserId =
                    currentUserId,

                ProjectId =
                    projectId,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _context.Meetings.AddAsync(
            meeting,
            cancellationToken);

        foreach (var participantId
                 in participantIds)
        {
            var participant =
                new MeetingParticipant
                {
                    Id =
                        Guid.NewGuid(),

                    MeetingId =
                        meeting.Id,

                    UserId =
                        participantId,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            await _context.MeetingParticipants
                .AddAsync(
                    participant,
                    cancellationToken);

            /*
             * Toplantıyı oluşturan kişiye
             * ayrıca bildirim göndermiyoruz.
             */
            if (participantId ==
                currentUserId)
            {
                continue;
            }

            var notification =
                new Notification
                {
                    Id =
                        Guid.NewGuid(),

                    UserId =
                        participantId,

                    Title =
                        "Yeni online toplantı",

                    Message =
                        $"{title} toplantısı " +
                        $"{request.StartDateTime.ToLocalTime():dd.MM.yyyy HH:mm} " +
                        $"için planlandı. " +
                        $"Katılımcılar: {audienceLabel}.",

                    Type =
                        NotificationType.MeetingAdded,

                    RelatedEntityId =
                        meeting.Id,

                    RelatedEntityType =
                        "Meeting",

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            await _context.Notifications
                .AddAsync(
                    notification,
                    cancellationToken);
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        return await BuildDtoAsync(
                   meeting.Id,
                   currentUserId,
                   true,
                   cancellationToken)
               ??
               throw new InvalidOperationException(
                   "Toplantı oluşturuldu ancak tekrar okunamadı.");
    }

    public async Task<IReadOnlyList<MeetingDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var query =
            _context.Meetings
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted);

        /*
         * Admin bütün toplantıları görür.
         *
         * Diğer kullanıcılar yalnızca
         * katıldıkları toplantıları görür.
         */
        if (!isAdmin)
        {
            query =
                query.Where(x =>
                    x.CreatedByUserId ==
                    currentUserId ||

                    x.Participants.Any(p =>
                        p.UserId ==
                        currentUserId &&
                        !p.IsDeleted));
        }

        return await query
            .OrderBy(x =>
                x.StartDateTime)
            .Select(x =>
                new MeetingDto
                {
                    Id =
                        x.Id,

                    Title =
                        x.Title,

                    Description =
                        x.Description,

                    StartDateTime =
                        x.StartDateTime,

                    EndDateTime =
                        x.EndDateTime,

                    ScopeType =
                        x.ScopeType,

                    AudienceLabel =
                        x.AudienceLabel,

                    RoomName =
                        x.RoomName,

                    CreatedByUserId =
                        x.CreatedByUserId,

                    CreatedByUserName =
                        x.CreatedByUser.FirstName +
                        " " +
                        x.CreatedByUser.LastName,

                    ProjectId =
                        x.ProjectId,

                    ProjectName =
                        x.Project != null
                            ? x.Project.Name
                            : null,

                    ParticipantCount =
                        x.Participants.Count(
                            p =>
                                !p.IsDeleted),

                    CanJoin =
                        true,

                    CreatedAt =
                        x.CreatedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<MeetingDto?> GetByIdAsync(
        Guid meetingId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        return await BuildDtoAsync(
            meetingId,
            currentUserId,
            isAdmin,
            cancellationToken);
    }

    private async Task<MeetingDto?> BuildDtoAsync(
        Guid meetingId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var query =
            _context.Meetings
                .AsNoTracking()
                .Where(x =>
                    x.Id == meetingId &&
                    !x.IsDeleted);

        if (!isAdmin)
        {
            query =
                query.Where(x =>
                    x.CreatedByUserId ==
                    currentUserId ||

                    x.Participants.Any(
                        p =>
                            p.UserId ==
                            currentUserId &&
                            !p.IsDeleted));
        }

        return await query
            .Select(x =>
                new MeetingDto
                {
                    Id =
                        x.Id,

                    Title =
                        x.Title,

                    Description =
                        x.Description,

                    StartDateTime =
                        x.StartDateTime,

                    EndDateTime =
                        x.EndDateTime,

                    ScopeType =
                        x.ScopeType,

                    AudienceLabel =
                        x.AudienceLabel,

                    RoomName =
                        x.RoomName,

                    CreatedByUserId =
                        x.CreatedByUserId,

                    CreatedByUserName =
                        x.CreatedByUser.FirstName +
                        " " +
                        x.CreatedByUser.LastName,

                    ProjectId =
                        x.ProjectId,

                    ProjectName =
                        x.Project != null
                            ? x.Project.Name
                            : null,

                    ParticipantCount =
                        x.Participants.Count(
                            p =>
                                !p.IsDeleted),

                    CanJoin =
                        true,

                    CreatedAt =
                        x.CreatedAt
                })
            .FirstOrDefaultAsync(
                cancellationToken);
    }

    private async Task<bool> IsAdminAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.UserId ==
                    currentUserId &&

                    x.IsActive &&

                    !x.IsDeleted &&

                    x.Role.Name ==
                    "Admin" &&

                    x.Role.IsActive &&

                    !x.Role.IsDeleted,

                cancellationToken);
    }
}