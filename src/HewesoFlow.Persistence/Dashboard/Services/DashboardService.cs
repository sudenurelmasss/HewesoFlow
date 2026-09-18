using HewesoFlow.Application.Abstractions.Dashboard;
using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Features.Dashboard.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        /*
         * Önce kullanıcının Admin olup olmadığını buluyoruz.
         */
        var isAdmin =
            await IsUserInRoleAsync(
                currentUserId,
                "Admin",
                cancellationToken);

        /*
         * =====================================================
         * ADMIN DASHBOARD
         * =====================================================
         *
         * Admin belirli bir projenin sahibi / üyesi olmak
         * zorunda değil.
         *
         * Admin tüm şirketi gördüğü için burada sistemdeki
         * bütün projeleri ve bütün görevleri alıyoruz.
         */
        if (isAdmin)
        {
            return await GetAdminSummaryAsync(
                cancellationToken);
        }

        /*
         * =====================================================
         * PROJECT MANAGER / TEAM MEMBER
         * =====================================================
         */

        return await GetUserSummaryAsync(
            currentUserId,
            cancellationToken);
    }

    /* =========================================================
       ADMIN SUMMARY
       ========================================================= */

    private async Task<DashboardSummaryDto> GetAdminSummaryAsync(
        CancellationToken cancellationToken)
    {
        var projects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    !project.IsDeleted,
                cancellationToken);

        var projectIds =
            projects
                .Select(project => project.Id)
                .ToHashSet();

        var projectTasks =
            projectIds.Count == 0
                ? new List<ProjectTask>()
                : await _unitOfWork.ProjectTasks.FindAsync(
                    task =>
                        projectIds.Contains(task.ProjectId) &&
                        !task.IsDeleted,
                    cancellationToken);

        /*
         * Bir proje gerçekten tamamlandı mı?
         *
         * PM onayı gerekmiyorsa Status=Completed yeterli.
         *
         * PM onayı gerekiyorsa hem Completed olmalı,
         * hem de CompletionApprovedAt dolu olmalı.
         */
        var completedProjectCount =
            projects.Count(
                IsProjectReallyCompleted);

        /*
         * Cancelled projeyi devam eden saymıyoruz.
         *
         * PM onayı verilmemiş proje ise
         * devam eden tarafta kalıyor.
         */
        var activeProjectCount =
            projects.Count(
                project =>
                    project.Status != ProjectStatus.Cancelled &&
                    !IsProjectReallyCompleted(project));

        var totalTasks =
            projectTasks.Count;

        var completedTasks =
            projectTasks.Count(
                task =>
                    task.Status == ProjectTaskStatus.Done);

        var completionPercentage =
            totalTasks == 0
                ? 0
                : Math.Round(
                    (decimal)completedTasks /
                    totalTasks *
                    100,
                    2);

        return new DashboardSummaryDto
        {
            /*
             * ADMIN:
             * tüm projeler
             */
            TotalProjects =
                projects.Count,

            /*
             * ADMIN:
             * tüm departmanlardaki görevler
             */
            TotalTasks =
                totalTasks,

            /*
             * Görev detayları backend'de tutulmaya devam ediyor.
             * Ancak Admin Dashboard artık bunları ana kartlarda
             * kullanmayacak.
             */
            TodoTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.Todo),

            InProgressTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InProgress),

            InReviewTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InReview),

            CompletedTasks =
                completedTasks,

            OverdueTasks =
                0,

            AssignedToMeTasks =
                0,

            CompletionPercentage =
                completionPercentage,

            /*
             * Admin ana kartlarında kullanılacak alanlar.
             */
            ActiveProjects =
                activeProjectCount,

            CompletedProjects =
                completedProjectCount
        };
    }

    /* =========================================================
       NORMAL USER SUMMARY
       ========================================================= */

    private async Task<DashboardSummaryDto> GetUserSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        /*
         * Kullanıcının sahibi olduğu projeler.
         */
        var ownedProjects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    project.OwnerId == currentUserId &&
                    !project.IsDeleted,
                cancellationToken);

        /*
         * Kullanıcının üye olduğu projeler.
         */
        var memberProjects =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var accessibleProjectIds =
            ownedProjects
                .Select(
                    project =>
                        project.Id)
                .Concat(
                    memberProjects.Select(
                        member =>
                            member.ProjectId))
                .Distinct()
                .ToHashSet();

        /*
         * Kullanıcı hiçbir projeye erişemiyorsa
         * boş dashboard döndür.
         */
        if (accessibleProjectIds.Count == 0)
        {
            return new DashboardSummaryDto();
        }

        var projects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    accessibleProjectIds.Contains(project.Id) &&
                    !project.IsDeleted,
                cancellationToken);

        var projectTasks =
            await _unitOfWork.ProjectTasks.FindAsync(
                task =>
                    accessibleProjectIds.Contains(task.ProjectId) &&
                    !task.IsDeleted,
                cancellationToken);

        var totalTasks =
            projectTasks.Count;

        var completedTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.Done);

        var completionPercentage =
            totalTasks == 0
                ? 0
                : Math.Round(
                    (decimal)completedTasks /
                    totalTasks *
                    100,
                    2);

        var now =
            DateTime.UtcNow;

        return new DashboardSummaryDto
        {
            TotalProjects =
                accessibleProjectIds.Count,

            TotalTasks =
                totalTasks,

            TodoTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.Todo),

            InProgressTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InProgress),

            InReviewTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InReview),

            CompletedTasks =
                completedTasks,

            OverdueTasks =
                projectTasks.Count(
                    task =>
                        task.DueDate.HasValue &&
                        task.DueDate.Value < now &&
                        task.Status !=
                        ProjectTaskStatus.Done),

            AssignedToMeTasks =
                projectTasks.Count(
                    task =>
                        task.AssignedUserId ==
                        currentUserId),

            CompletionPercentage =
                completionPercentage,

            ActiveProjects =
                projects.Count(
                    project =>
                        project.Status !=
                        ProjectStatus.Cancelled &&
                        !IsProjectReallyCompleted(
                            project)),

            CompletedProjects =
                projects.Count(
                    IsProjectReallyCompleted)
        };
    }

    /* =========================================================
       PROJECT COMPLETION
       ========================================================= */

    private static bool IsProjectReallyCompleted(
        Project project)
    {
        /*
         * Önce proje status gerçekten Completed mı?
         */
        if (project.Status != ProjectStatus.Completed)
        {
            return false;
        }

        /*
         * PM onayı gerekmiyorsa
         * Completed olması yeterli.
         */
        if (!project.RequiresMemberApproval)
        {
            return true;
        }

        /*
         * PM onayı gerekiyorsa fakat henüz verilmediyse
         * proje devam eden kabul edilir.
         */
        return project.CompletionApprovedAt.HasValue;
    }

    /* =========================================================
       ROLE CHECK
       ========================================================= */

    private async Task<bool> IsUserInRoleAsync(
        Guid userId,
        string roleName,
        CancellationToken cancellationToken)
    {
        var userRoles =
            await _unitOfWork.UserRoles.FindAsync(
                userRole =>
                    userRole.UserId == userId &&
                    userRole.IsActive &&
                    !userRole.IsDeleted,
                cancellationToken);

        if (userRoles.Count == 0)
        {
            return false;
        }

        var roleIds =
            userRoles
                .Select(
                    userRole =>
                        userRole.RoleId)
                .ToHashSet();

        var roles =
            await _unitOfWork.Roles.FindAsync(
                role =>
                    roleIds.Contains(role.Id) &&
                    !role.IsDeleted,
                cancellationToken);

        return roles.Any(
            role =>
                string.Equals(
                    role.Name?.Trim(),
                    roleName,
                    StringComparison.OrdinalIgnoreCase));
    }
}