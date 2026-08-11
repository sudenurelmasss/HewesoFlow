using HewesoFlow.Application.Abstractions.Reports;
using HewesoFlow.Application.Features.Reports.DTOs;
using HewesoFlow.Domain.Enums;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Reports.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummaryDto> GetSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var accessibleProjectIds =
            await GetAccessibleProjectIdsAsync(
                currentUserId,
                cancellationToken);

        var projects =
            await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    accessibleProjectIds.Contains(project.Id) &&
                    !project.IsDeleted)
                .Select(project => project.Id)
                .ToListAsync(cancellationToken);

        var tasks =
            await _context.ProjectTasks
                .AsNoTracking()
                .Where(task =>
                    projects.Contains(task.ProjectId) &&
                    !task.IsDeleted)
                .Select(task => new
                {
                    task.Id,
                    task.Status,
                    task.DueDate
                })
                .ToListAsync(cancellationToken);

        var completedTasks =
            tasks.Count(task =>
                task.Status ==
                ProjectTaskStatus.Done);

        var overdueTasks =
            tasks.Count(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value < DateTime.UtcNow &&
                task.Status !=
                ProjectTaskStatus.Done);

        var activeUsers =
            await _context.Users
                .AsNoTracking()
                .CountAsync(
                    user =>
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

        var completionPercentage =
            tasks.Count == 0
                ? 0
                : Math.Round(
                    (decimal)completedTasks /
                    tasks.Count *
                    100,
                    2);

        return new ReportSummaryDto
        {
            TotalProjects =
                projects.Count,

            TotalTasks =
                tasks.Count,

            CompletedTasks =
                completedTasks,

            OverdueTasks =
                overdueTasks,

            ActiveUsers =
                activeUsers,

            OverallCompletionPercentage =
                completionPercentage
        };
    }

    public async Task<IReadOnlyList<WorkloadUserDto>> GetWorkloadAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var accessibleProjectIds =
            await GetAccessibleProjectIdsAsync(
                currentUserId,
                cancellationToken);

        var assignedTasks =
            await _context.ProjectTasks
                .AsNoTracking()
                .Where(task =>
                    accessibleProjectIds.Contains(
                        task.ProjectId) &&
                    task.AssignedUserId.HasValue &&
                    !task.IsDeleted)
                .Select(task => new
                {
                    task.Id,

                    UserId =
                        task.AssignedUserId!.Value,

                    task.Status,
                    task.DueDate
                })
                .ToListAsync(cancellationToken);

        var userIds =
            assignedTasks
                .Select(task =>
                    task.UserId)
                .Distinct()
                .ToList();

        var users =
            await _context.Users
                .AsNoTracking()
                .Where(user =>
                    userIds.Contains(user.Id) &&
                    user.IsActive &&
                    !user.IsDeleted)
                .Select(user => new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,

                    DepartmentName =
                        user.DepartmentEntity != null
                            ? user.DepartmentEntity.Name
                            : user.Department
                })
                .ToListAsync(cancellationToken);

        var now =
            DateTime.UtcNow;

        var result =
            new List<WorkloadUserDto>();

        foreach (var user in users)
        {
            var userTasks =
                assignedTasks
                    .Where(task =>
                        task.UserId == user.Id)
                    .ToList();

            result.Add(
                new WorkloadUserDto
                {
                    UserId =
                        user.Id,

                    UserName =
                        $"{user.FirstName} {user.LastName}"
                            .Trim(),

                    DepartmentName =
                        user.DepartmentName,

                    TotalTasks =
                        userTasks.Count,

                    TodoTasks =
                        userTasks.Count(task =>
                            task.Status ==
                            ProjectTaskStatus.Todo),

                    InProgressTasks =
                        userTasks.Count(task =>
                            task.Status ==
                            ProjectTaskStatus.InProgress),

                    InReviewTasks =
                        userTasks.Count(task =>
                            task.Status ==
                            ProjectTaskStatus.InReview),

                    CompletedTasks =
                        userTasks.Count(task =>
                            task.Status ==
                            ProjectTaskStatus.Done),

                    OverdueTasks =
                        userTasks.Count(task =>
                            task.DueDate.HasValue &&
                            task.DueDate.Value < now &&
                            task.Status !=
                            ProjectTaskStatus.Done)
                });
        }

        return result
            .OrderByDescending(
                user =>
                    user.TotalTasks)
            .ThenBy(
                user =>
                    user.UserName)
            .ToList();
    }

    public async Task<IReadOnlyList<ProjectReportDto>> GetProjectsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var accessibleProjectIds =
            await GetAccessibleProjectIdsAsync(
                currentUserId,
                cancellationToken);

        var projects =
            await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    accessibleProjectIds.Contains(project.Id) &&
                    !project.IsDeleted)
                .Select(project => new
                {
                    project.Id,
                    project.Name,

                    DepartmentName =
                        project.Department != null
                            ? project.Department.Name
                            : null
                })
                .ToListAsync(cancellationToken);

        var projectIds =
            projects
                .Select(project =>
                    project.Id)
                .ToList();

        var tasks =
            await _context.ProjectTasks
                .AsNoTracking()
                .Where(task =>
                    projectIds.Contains(task.ProjectId) &&
                    !task.IsDeleted)
                .Select(task => new
                {
                    task.Id,
                    task.ProjectId,
                    task.Status,
                    task.DueDate
                })
                .ToListAsync(cancellationToken);

        var members =
            await _context.ProjectMembers
                .AsNoTracking()
                .Where(member =>
                    projectIds.Contains(member.ProjectId) &&
                    member.IsActive &&
                    !member.IsDeleted)
                .Select(member => new
                {
                    member.ProjectId,
                    member.UserId
                })
                .ToListAsync(cancellationToken);

        var now =
            DateTime.UtcNow;

        var result =
            new List<ProjectReportDto>();

        foreach (var project in projects)
        {
            var projectTasks =
                tasks
                    .Where(task =>
                        task.ProjectId ==
                        project.Id)
                    .ToList();

            var completedTasks =
                projectTasks.Count(task =>
                    task.Status ==
                    ProjectTaskStatus.Done);

            var overdueTasks =
                projectTasks.Count(task =>
                    task.DueDate.HasValue &&
                    task.DueDate.Value < now &&
                    task.Status !=
                    ProjectTaskStatus.Done);

            var completionPercentage =
                projectTasks.Count == 0
                    ? 0
                    : Math.Round(
                        (decimal)completedTasks /
                        projectTasks.Count *
                        100,
                        2);

            result.Add(
                new ProjectReportDto
                {
                    ProjectId =
                        project.Id,

                    ProjectName =
                        project.Name,

                    DepartmentName =
                        project.DepartmentName,

                    TotalTasks =
                        projectTasks.Count,

                    CompletedTasks =
                        completedTasks,

                    OverdueTasks =
                        overdueTasks,

                    CompletionPercentage =
                        completionPercentage,

                    MemberCount =
                        members
                            .Where(member =>
                                member.ProjectId ==
                                project.Id)
                            .Select(member =>
                                member.UserId)
                            .Distinct()
                            .Count()
                });
        }

        return result
            .OrderByDescending(
                project =>
                    project.OverdueTasks)
            .ThenBy(
                project =>
                    project.ProjectName)
            .ToList();
    }

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    !project.IsDeleted)
                .Select(project =>
                    project.Id)
                .ToListAsync(cancellationToken);
        }

        var owned =
            await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    project.OwnerId ==
                    currentUserId &&
                    !project.IsDeleted)
                .Select(project =>
                    project.Id)
                .ToListAsync(cancellationToken);

        var memberships =
            await _context.ProjectMembers
                .AsNoTracking()
                .Where(member =>
                    member.UserId ==
                    currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted)
                .Select(member =>
                    member.ProjectId)
                .ToListAsync(cancellationToken);

        return owned
            .Concat(memberships)
            .Distinct()
            .ToList();
    }

    private async Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                role =>
                    role.UserId == userId &&
                    role.IsActive &&
                    !role.IsDeleted &&
                    role.Role.IsActive &&
                    !role.Role.IsDeleted &&
                    role.Role.Name == "Admin",
                cancellationToken);
    }
}