using HewesoFlow.Application.Abstractions.Projects;
using HewesoFlow.Application.Features.Projects.DTOs;

using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

using HewesoFlow.Persistence.Contexts;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Projects.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(
        AppDbContext context)
    {
        _context =
            context;
    }

    /* =========================================================
       CREATE
       ========================================================= */

    public async Task<ProjectResponseDto> CreateAsync(
    CreateProjectRequestDto request,
    Guid currentUserId,
    CancellationToken cancellationToken = default)
{
    if (request is null)
    {
        throw new ArgumentNullException(
            nameof(request));
    }

    var isAdmin =
        await IsAdminAsync(
            currentUserId,
            cancellationToken);

    var isProjectManager =
        await IsProjectManagerAsync(
            currentUserId,
            cancellationToken);

    if (!isAdmin &&
        !isProjectManager)
    {
        throw new UnauthorizedAccessException(
            "Yalnızca Admin veya ProjectManager proje oluşturabilir.");
    }

    /* =====================================================
       PROJECT NAME
       ===================================================== */

    var projectName =
        request.Name?.Trim() ??
        string.Empty;

    ValidateProjectName(
        projectName);

    /* =====================================================
       DEPARTMENT
       ===================================================== */

    if (request.DepartmentId ==
        Guid.Empty)
    {
        throw new InvalidOperationException(
            "Proje departmanı zorunludur.");
    }

    var department =
        await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                department =>
                    department.Id ==
                        request.DepartmentId &&
                    department.IsActive &&
                    !department.IsDeleted,
                cancellationToken);

    if (department is null)
    {
        throw new InvalidOperationException(
            "Seçilen departman bulunamadı veya aktif değil.");
    }

    /* =====================================================
       PROJECT MANAGER
       ===================================================== */

    Guid selectedProjectManagerId;

    /*
     * ADMIN:
     *
     * Admin proje oluştururken
     * ProjectManager seçmek zorunda.
     */
    if (isAdmin)
    {
        if (!request.ProjectManagerId.HasValue ||
            request.ProjectManagerId.Value ==
                Guid.Empty)
        {
            throw new InvalidOperationException(
                "Admin proje oluştururken bir ProjectManager seçmelidir.");
        }

        selectedProjectManagerId =
            request.ProjectManagerId.Value;
    }

    /*
     * PROJECT MANAGER:
     *
     * Kendi oluşturduğu projede
     * ProjectManager otomatik kendisi.
     */
    else
    {
        selectedProjectManagerId =
            currentUserId;
    }

    /* =====================================================
       VALIDATE SELECTED MANAGER
       ===================================================== */

    var selectedManager =
        await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                user =>
                    user.Id ==
                        selectedProjectManagerId &&
                    user.IsActive &&
                    !user.IsDeleted,
                cancellationToken);

    if (selectedManager is null)
    {
        throw new InvalidOperationException(
            "Seçilen ProjectManager bulunamadı veya aktif değil.");
    }

    /*
     * Manager mutlaka seçilen departmanda olmalı.
     */
    if (!selectedManager.DepartmentId.HasValue ||
        selectedManager.DepartmentId.Value !=
            department.Id)
    {
        throw new InvalidOperationException(
            "Seçilen ProjectManager bu departmana ait değildir.");
    }

    /*
     * Gerçekten ProjectManager rolü var mı?
     */
    var selectedUserIsManager =
        await IsProjectManagerAsync(
            selectedManager.Id,
            cancellationToken);

    if (!selectedUserIsManager)
    {
        throw new InvalidOperationException(
            "Seçilen kullanıcı ProjectManager rolüne sahip değildir.");
    }

    /*
     * ProjectManager kendi proje oluşturuyorsa
     * kendi departmanından başka departmanda
     * oluşturamaz.
     */
    if (!isAdmin &&
        selectedManager.Id ==
            currentUserId &&
        selectedManager.DepartmentId.Value !=
            department.Id)
    {
        throw new UnauthorizedAccessException(
            "ProjectManager yalnızca kendi departmanında proje oluşturabilir.");
    }

    /* =====================================================
       DATES
       ===================================================== */

    var startDate =
        request.StartDate ??
        DateTime.UtcNow;

    ValidateProjectDates(
        startDate,
        request.EndDate);

    /* =====================================================
       CREATE PROJECT
       ===================================================== */

    var project =
        new Project
        {
            Id =
                Guid.NewGuid(),

            Name =
                projectName,

            Description =
                ValidateDescription(
                    request.Description),

            OwnerId =
                currentUserId,

            DepartmentId =
                department.Id,

            ProjectManagerId =
                selectedManager.Id,

            StartDate =
                startDate,

            EndDate =
                request.EndDate,

            Status =
                ProjectStatus.Planning,

            RequiresMemberApproval =
                request.RequiresMemberApproval,

            CompletionRequestedAt =
                null,

            CompletionApprovedAt =
                null,

            CompletionApprovedByUserId =
                null,

            CreatedAt =
                DateTime.UtcNow,

            UpdatedAt =
                null,

            IsDeleted =
                false
        };

    await _context.Projects.AddAsync(
        project,
        cancellationToken);

    /* =====================================================
       PROJECT MANAGER AUTO MEMBER
       ===================================================== */

    var projectManagerMember =
        new ProjectMember
        {
            Id =
                Guid.NewGuid(),

            ProjectId =
                project.Id,

            UserId =
                selectedManager.Id,

            Role =
                ProjectMemberRole.Manager,

            JoinedAt =
                DateTime.UtcNow,

            IsActive =
                true,

            IsDeleted =
                false,

            CreatedAt =
                DateTime.UtcNow
        };

    await _context.ProjectMembers.AddAsync(
        projectManagerMember,
        cancellationToken);

    await _context.SaveChangesAsync(
        cancellationToken);

    return await GetResponseAsync(
        project.Id,
        cancellationToken);
}

    public async Task<IReadOnlyList<ProjectListDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        IQueryable<Project> query =
            _context.Projects
                .AsNoTracking()
                .Include(
                    project =>
                        project.Department)
                .Include(
                    project =>
                        project.ProjectManager)
                .Where(
                    project =>
                        !project.IsDeleted);

        /*
         * Admin tüm projeleri görür.
         *
         * Diğer kullanıcılar:
         * - oluşturduğu,
         * - yöneticisi olduğu,
         * - üyesi olduğu
         * projeleri görür.
         */

        if (!isAdmin)
        {
            query =
                query.Where(
                    project =>
                        project.OwnerId ==
                            currentUserId ||

                        project.ProjectManagerId ==
                            currentUserId ||

                        project.Members.Any(
                            member =>
                                member.UserId ==
                                    currentUserId &&
                                member.IsActive &&
                                !member.IsDeleted));
        }

        var projects =
            await query
                .OrderBy(
                    project =>
                        project.Department != null
                            ? project.Department.Name
                            : string.Empty)
                .ThenByDescending(
                    project =>
                        project.CreatedAt)
                .ToListAsync(
                    cancellationToken);

        return projects
            .Select(
                MapToList)
            .ToList();
    }

    /* =========================================================
       GET BY ID
       ========================================================= */

    public async Task<ProjectResponseDto?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .Include(
                    project =>
                        project.Department)
                .Include(
                    project =>
                        project.ProjectManager)
                .Include(
                    project =>
                        project.Members)
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            id &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return null;
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        if (!isAdmin)
        {
            var canAccess =
                project.OwnerId ==
                    currentUserId ||

                project.ProjectManagerId ==
                    currentUserId ||

                project.Members.Any(
                    member =>
                        member.UserId ==
                            currentUserId &&
                        member.IsActive &&
                        !member.IsDeleted);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "Bu projeyi görüntüleme yetkiniz bulunmamaktadır.");
            }
        }

        return MapToResponse(
            project);
    }

    /* =========================================================
       UPDATE
       ========================================================= */

    public async Task<ProjectResponseDto?> UpdateAsync(
        UpdateProjectRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(
                nameof(request));
        }

        var project =
            await _context.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            request.Id &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return null;
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var isProjectManager =
            await IsProjectManagerAsync(
                currentUserId,
                cancellationToken);

        var assignedManager =
            project.ProjectManagerId ==
            currentUserId;

        /*
         * Admin her projeyi düzenleyebilir.
         *
         * ProjectManager yalnızca sorumlusu olduğu
         * projeyi düzenleyebilir.
         */

        if (!isAdmin &&
            (!isProjectManager ||
             !assignedManager))
        {
            throw new UnauthorizedAccessException(
                "Bu projeyi güncelleme yetkiniz bulunmamaktadır.");
        }

        /* =====================================================
           DEPARTMENT
           ===================================================== */

        if (request.DepartmentId ==
            Guid.Empty)
        {
            throw new InvalidOperationException(
                "Projenin departmanı boş bırakılamaz.");
        }

        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    department =>
                        department.Id ==
                            request.DepartmentId &&
                        department.IsActive &&
                        !department.IsDeleted,
                    cancellationToken);

        if (department is null)
        {
            throw new InvalidOperationException(
                "Seçilen departman bulunamadı veya aktif değil.");
        }

        if (!department.ManagerId.HasValue)
        {
            throw new InvalidOperationException(
                "Seçilen departmana ProjectManager atanmamış.");
        }

        var newManager =
            await _context.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Id ==
                            department.ManagerId.Value &&
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

        if (newManager is null)
        {
            throw new InvalidOperationException(
                "Seçilen departmanın aktif ProjectManager kullanıcısı bulunamadı.");
        }

        var newManagerHasRole =
            await IsProjectManagerAsync(
                newManager.Id,
                cancellationToken);

        if (!newManagerHasRole)
        {
            throw new InvalidOperationException(
                "Seçilen departmanın yöneticisinde ProjectManager rolü bulunmuyor.");
        }

        /* =====================================================
           PROJECT MANAGER CANNOT MOVE TO ANOTHER DEPARTMENT
           ===================================================== */

        if (!isAdmin &&
            department.ManagerId.Value !=
                currentUserId)
        {
            throw new UnauthorizedAccessException(
                "ProjectManager projeyi başka bir departmana taşıyamaz.");
        }

        /* =====================================================
           DEPARTMENT CHANGE
           ===================================================== */

        if (project.DepartmentId !=
            request.DepartmentId)
        {
            /*
             * Manager dışındaki aktif üyeler varsa
             * departman değişikliğini engelliyoruz.
             */

            var hasOtherMembers =
                await _context.ProjectMembers
                    .AsNoTracking()
                    .AnyAsync(
                        member =>
                            member.ProjectId ==
                                project.Id &&
                            member.UserId !=
                                project.ProjectManagerId &&
                            member.IsActive &&
                            !member.IsDeleted,
                        cancellationToken);

            if (hasOtherMembers)
            {
                throw new InvalidOperationException(
                    "Projede aktif ekip üyeleri bulunduğu için departman değiştirilemez. Önce proje üyelerini düzenleyin.");
            }

            /*
             * Eski manager üyeliğini pasif yap.
             */

            var oldManagerMember =
                await _context.ProjectMembers
                    .FirstOrDefaultAsync(
                        member =>
                            member.ProjectId ==
                                project.Id &&
                            member.UserId ==
                                project.ProjectManagerId &&
                            member.IsActive &&
                            !member.IsDeleted,
                        cancellationToken);

            if (oldManagerMember is not null)
            {
                oldManagerMember.IsActive =
                    false;

                oldManagerMember.IsDeleted =
                    true;

                oldManagerMember.UpdatedAt =
                    DateTime.UtcNow;
            }

            /*
             * Yeni manager üyeliği var mı?
             */

            var newManagerMember =
                await _context.ProjectMembers
                    .FirstOrDefaultAsync(
                        member =>
                            member.ProjectId ==
                                project.Id &&
                            member.UserId ==
                                newManager.Id,
                        cancellationToken);

            if (newManagerMember is null)
            {
                newManagerMember =
                    new ProjectMember
                    {
                        Id =
                            Guid.NewGuid(),

                        ProjectId =
                            project.Id,

                        UserId =
                            newManager.Id,

                        Role =
                            ProjectMemberRole.Manager,

                        JoinedAt =
                            DateTime.UtcNow,

                        IsActive =
                            true,

                        IsDeleted =
                            false,

                        CreatedAt =
                            DateTime.UtcNow
                    };

                await _context.ProjectMembers.AddAsync(
                    newManagerMember,
                    cancellationToken);
            }
            else
            {
                newManagerMember.Role =
                    ProjectMemberRole.Manager;

                newManagerMember.IsActive =
                    true;

                newManagerMember.IsDeleted =
                    false;

                newManagerMember.UpdatedAt =
                    DateTime.UtcNow;
            }
        }

        /* =====================================================
           VALIDATION
           ===================================================== */

        var projectName =
            request.Name?.Trim() ??
            string.Empty;

        ValidateProjectName(
            projectName);

        var startDate =
            request.StartDate ??
            project.StartDate;

        ValidateProjectDates(
            startDate,
            request.EndDate);

        /* =====================================================
           UPDATE VALUES
           ===================================================== */

        project.Name =
            projectName;

        project.Description =
            ValidateDescription(
                request.Description);

        project.DepartmentId =
            department.Id;

        project.ProjectManagerId =
            newManager.Id;

        project.StartDate =
            startDate;

        project.EndDate =
            request.EndDate;

        project.RequiresMemberApproval =
            request.RequiresMemberApproval;

        project.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return await GetResponseAsync(
            project.Id,
            cancellationToken);
    }

    /* =========================================================
       DELETE
       ========================================================= */

    public async Task<bool> DeleteAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _context.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            id &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return false;
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var isProjectManager =
            await IsProjectManagerAsync(
                currentUserId,
                cancellationToken);

        /*
         * Mevcut silme mantığını koruyoruz:
         *
         * Admin:
         * Her projeyi silebilir.
         *
         * ProjectManager:
         * Yalnızca kendi oluşturduğu projeyi silebilir.
         */

        var managerCreatedProject =
            project.OwnerId ==
                currentUserId;

        if (!isAdmin &&
            (!isProjectManager ||
             !managerCreatedProject))
        {
            throw new UnauthorizedAccessException(
                "Bu projeyi silme yetkiniz bulunmamaktadır.");
        }

        project.IsDeleted =
            true;

        project.UpdatedAt =
            DateTime.UtcNow;

        /*
         * Proje üyeliklerini de pasif hale getiriyoruz.
         */

        var members =
            await _context.ProjectMembers
                .Where(
                    member =>
                        member.ProjectId ==
                            project.Id &&
                        member.IsActive &&
                        !member.IsDeleted)
                .ToListAsync(
                    cancellationToken);

        foreach (var member in members)
        {
            member.IsActive =
                false;

            member.IsDeleted =
                true;

            member.UpdatedAt =
                DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    /* =========================================================
       REQUEST COMPLETION
       ========================================================= */

    public async Task<ProjectResponseDto?> RequestCompletionAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _context.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return null;
        }

        var isProjectManager =
            await IsProjectManagerAsync(
                currentUserId,
                cancellationToken);

        var assignedManager =
            project.ProjectManagerId ==
                currentUserId;

        /*
         * Tamamlama / onay süreci Admin tarafından başlatılamaz.
         * Yalnızca projeye atanmış ProjectManager yetkilidir.
         */

        if (!isProjectManager ||
            !assignedManager)
        {
            throw new UnauthorizedAccessException(
                "Bu proje için tamamlama işlemini yalnızca atanmış ProjectManager başlatabilir.");
        }

        if (project.Status ==
            ProjectStatus.Completed)
        {
            throw new InvalidOperationException(
                "Proje zaten tamamlanmış.");
        }

        project.CompletionRequestedAt =
            DateTime.UtcNow;

        /*
         * Onay gerekmiyorsa direkt tamamla.
         */

        if (!project.RequiresMemberApproval)
        {
            project.Status =
                ProjectStatus.Completed;

            project.CompletionApprovedAt =
                DateTime.UtcNow;

            project.CompletionApprovedByUserId =
                currentUserId;
        }
        else
        {
            /*
             * Onay gerekiyorsa yalnızca atanmış
             * ProjectManager son onayı verecek.
             */

            project.Status =
                ProjectStatus.PendingApproval;

            project.CompletionApprovedAt =
                null;

            project.CompletionApprovedByUserId =
                null;
        }

        project.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return await GetResponseAsync(
            project.Id,
            cancellationToken);
    }

    /* =========================================================
       APPROVE COMPLETION
       ========================================================= */

    public async Task<ProjectResponseDto?> ApproveCompletionAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _context.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return null;
        }

        if (!project.RequiresMemberApproval)
        {
            throw new InvalidOperationException(
                "Bu projede ProjectManager onayı gerekli değil.");
        }

        if (project.Status ==
            ProjectStatus.Completed)
        {
            throw new InvalidOperationException(
                "Proje zaten tamamlanmış.");
        }

        /*
         * Tamamlamayı başlat adımı kullanılmıyor.
         * Onay butonu tüm görevler tamamlandığında açılır.
         * Backend tarafında da aynı kural zorunlu tutulur.
         */

        var hasIncompleteTask =
            await _context.ProjectTasks
                .AsNoTracking()
                .AnyAsync(
                    task =>
                        task.ProjectId ==
                            project.Id &&
                        !task.IsDeleted &&
                        task.Status !=
                            ProjectTaskStatus.Done,
                    cancellationToken);

        var hasAnyTask =
            await _context.ProjectTasks
                .AsNoTracking()
                .AnyAsync(
                    task =>
                        task.ProjectId ==
                            project.Id &&
                        !task.IsDeleted,
                    cancellationToken);

        if (!hasAnyTask)
        {
            throw new InvalidOperationException(
                "Görevi olmayan proje onaylanamaz.");
        }

        if (hasIncompleteTask)
        {
            throw new InvalidOperationException(
                "Proje onayı için tüm görevlerin tamamlanmış olması gerekir.");
        }

        /*
         * BURASI ÖNEMLİ:
         *
         * Admin bile onay veremez.
         *
         * Sadece projeye atanmış ProjectManager.
         */

        if (project.ProjectManagerId !=
            currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Projeyi yalnızca bu projeye atanmış ProjectManager onaylayabilir.");
        }

        var isProjectManager =
            await IsProjectManagerAsync(
                currentUserId,
                cancellationToken);

        if (!isProjectManager)
        {
            throw new UnauthorizedAccessException(
                "Proje onayı yalnızca ProjectManager rolü tarafından verilebilir.");
        }

        project.Status =
            ProjectStatus.Completed;

        project.CompletionRequestedAt ??=
            DateTime.UtcNow;

        project.CompletionApprovedAt =
            DateTime.UtcNow;

        project.CompletionApprovedByUserId =
            currentUserId;

        project.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return await GetResponseAsync(
            project.Id,
            cancellationToken);
    }

    /* =========================================================
       PROJECT SUMMARY
       ========================================================= */

    public async Task<ProjectSummaryDto?> GetSummaryAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .Include(
                    project =>
                        project.Members)
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            return null;
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        if (!isAdmin)
        {
            var canAccess =
                project.OwnerId ==
                    currentUserId ||

                project.ProjectManagerId ==
                    currentUserId ||

                project.Members.Any(
                    member =>
                        member.UserId ==
                            currentUserId &&
                        member.IsActive &&
                        !member.IsDeleted);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException(
                    "Bu projenin özet bilgilerini görüntüleme yetkiniz bulunmamaktadır.");
            }
        }

        var projectTasks =
            await _context.ProjectTasks
                .AsNoTracking()
                .Where(
                    task =>
                        task.ProjectId ==
                            projectId &&
                        !task.IsDeleted)
                .ToListAsync(
                    cancellationToken);

        var totalTasks =
            projectTasks.Count;

        var todoTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.Todo);

        var inProgressTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.InProgress);

        var inReviewTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.InReview);

        var completedTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.Done);

        var now =
            DateTime.UtcNow;

        var overdueTasks =
            projectTasks.Count(
                task =>
                    task.DueDate.HasValue &&
                    task.DueDate.Value <
                        now &&
                    task.Status !=
                        ProjectTaskStatus.Done);

        var completionPercentage =
            totalTasks == 0
                ? 0
                : Math.Round(
                    (decimal)completedTasks /
                    totalTasks *
                    100,
                    2);

        return new ProjectSummaryDto
        {
            ProjectId =
                project.Id,

            ProjectName =
                project.Name,

            TotalTasks =
                totalTasks,

            TodoTasks =
                todoTasks,

            InProgressTasks =
                inProgressTasks,

            InReviewTasks =
                inReviewTasks,

            CompletedTasks =
                completedTasks,

            OverdueTasks =
                overdueTasks,

            CompletionPercentage =
                completionPercentage
        };
    }

    /* =========================================================
       GET RESPONSE
       ========================================================= */

    private async Task<ProjectResponseDto> GetResponseAsync(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .Include(
                    project =>
                        project.Department)
                .Include(
                    project =>
                        project.ProjectManager)
                .FirstAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        return MapToResponse(
            project);
    }

    /* =========================================================
       ROLE HELPERS
       ========================================================= */

    private async Task<bool> IsAdminAsync(
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

                    userRole.Role.IsActive &&

                    !userRole.Role.IsDeleted &&

                    userRole.Role.Name ==
                        "Admin",
                cancellationToken);
    }

    private async Task<bool> IsProjectManagerAsync(
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

                    userRole.Role.IsActive &&

                    !userRole.Role.IsDeleted &&

                    userRole.Role.Name ==
                        "ProjectManager",
                cancellationToken);
    }

    /* =========================================================
       VALIDATION
       ========================================================= */

    private static void ValidateProjectName(
        string projectName)
    {
        if (string.IsNullOrWhiteSpace(
            projectName))
        {
            throw new ArgumentException(
                "Proje adı boş bırakılamaz.");
        }

        if (projectName.Length <
            3)
        {
            throw new ArgumentException(
                "Proje adı en az 3 karakter olmalıdır.");
        }

        if (projectName.Length >
            150)
        {
            throw new ArgumentException(
                "Proje adı en fazla 150 karakter olabilir.");
        }
    }

    private static string ValidateDescription(
        string? description)
    {
        var value =
            description?.Trim() ??
            string.Empty;

        if (value.Length <
            3)
        {
            throw new ArgumentException(
                "Proje açıklaması zorunludur ve en az 3 karakter olmalıdır.");
        }

        if (value.Length >
            2000)
        {
            throw new ArgumentException(
                "Proje açıklaması en fazla 2000 karakter olabilir.");
        }

        return value;
    }

    private static void ValidateProjectDates(
        DateTime startDate,
        DateTime? endDate)
    {
        if (!endDate.HasValue)
        {
            return;
        }

        if (endDate.Value.Date <
            startDate.Date)
        {
            throw new ArgumentException(
                "Proje bitiş tarihi başlangıç tarihinden önce olamaz.");
        }
    }

    /* =========================================================
       MAPPING
       ========================================================= */

    private static ProjectResponseDto MapToResponse(
        Project project)
    {
        return new ProjectResponseDto
        {
            Id =
                project.Id,

            Name =
                project.Name,

            Description =
                project.Description,

            DepartmentId =
                project.DepartmentId,

            DepartmentName =
                project.Department?.Name ??
                string.Empty,

            ProjectManagerId =
                project.ProjectManagerId,

            ProjectManagerName =
                project.ProjectManager is null
                    ? string.Empty
                    : $"{project.ProjectManager.FirstName} {project.ProjectManager.LastName}".Trim(),

            StartDate =
                project.StartDate,

            EndDate =
                project.EndDate,

            Status =
                project.Status,

            RequiresMemberApproval =
                project.RequiresMemberApproval,

            CompletionRequestedAt =
                project.CompletionRequestedAt,

            CompletionApprovedAt =
                project.CompletionApprovedAt,

            CompletionApprovedByUserId =
                project.CompletionApprovedByUserId,

            OwnerId =
                project.OwnerId,

            CreatedAt =
                project.CreatedAt,

            UpdatedAt =
                project.UpdatedAt
        };
    }

    private static ProjectListDto MapToList(
        Project project)
    {
        return new ProjectListDto
        {
            Id =
                project.Id,

            Name =
                project.Name,

            Description =
                project.Description,

            DepartmentId =
                project.DepartmentId,

            DepartmentName =
                project.Department?.Name ??
                string.Empty,

            ProjectManagerId =
                project.ProjectManagerId,

            ProjectManagerName =
                project.ProjectManager is null
                    ? string.Empty
                    : $"{project.ProjectManager.FirstName} {project.ProjectManager.LastName}".Trim(),

            StartDate =
                project.StartDate,

            EndDate =
                project.EndDate,

            Status =
                project.Status,

            RequiresMemberApproval =
                project.RequiresMemberApproval,

            CompletionRequestedAt =
                project.CompletionRequestedAt,

            CompletionApprovedAt =
                project.CompletionApprovedAt,

            CompletionApprovedByUserId =
                project.CompletionApprovedByUserId,

            OwnerId =
                project.OwnerId,

            CreatedAt =
                project.CreatedAt
        };
    }
}