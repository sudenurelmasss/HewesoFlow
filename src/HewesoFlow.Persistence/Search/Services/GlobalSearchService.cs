using HewesoFlow.Application.Abstractions.Search;
using HewesoFlow.Application.Features.Search.DTOs;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Search.Services;

public class GlobalSearchService : IGlobalSearchService
{
    private readonly AppDbContext _context;

    public GlobalSearchService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<GlobalSearchResponseDto> SearchAsync(
        string query,
        Guid currentUserId,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        var normalizedQuery =
            query?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalizedQuery))
        {
            return new GlobalSearchResponseDto
            {
                Query = normalizedQuery,
                Results = new List<GlobalSearchResultDto>(),
                TotalCount = 0
            };
        }

        if (normalizedQuery.Length < 2)
        {
            throw new ArgumentException(
                "Arama metni en az 2 karakter olmalıdır.");
        }

        if (take < 1)
        {
            take = 20;
        }

        if (take > 100)
        {
            take = 100;
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var accessibleProjectIds =
            await GetAccessibleProjectIdsAsync(
                currentUserId,
                isAdmin,
                cancellationToken);

        var results =
            new List<GlobalSearchResultDto>();

        var projects =
            await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    !project.IsDeleted &&
                    accessibleProjectIds.Contains(project.Id) &&
                    (
                        project.Name.Contains(
                            normalizedQuery) ||
                        (
                            project.Description != null &&
                            project.Description.Contains(
                                normalizedQuery)
                        )
                    ))
                .OrderBy(project =>
                    project.Name)
                .Take(take)
                .Select(project =>
                    new GlobalSearchResultDto
                    {
                        Type = "Project",
                        Id = project.Id,
                        Title = project.Name,
                        Subtitle =
                            project.Description,
                        RelatedId =
                            project.DepartmentId,
                        RelatedName =
                            project.Department != null
                                ? project.Department.Name
                                : null
                    })
                .ToListAsync(
                    cancellationToken);

        results.AddRange(projects);

        var remainingAfterProjects =
            Math.Max(
                0,
                take - results.Count);

        if (remainingAfterProjects > 0)
        {
            var tasks =
                await _context.ProjectTasks
                    .AsNoTracking()
                    .Where(task =>
                        !task.IsDeleted &&
                        accessibleProjectIds.Contains(
                            task.ProjectId) &&
                        (
                            task.Title.Contains(
                                normalizedQuery) ||
                            (
                                task.Description != null &&
                                task.Description.Contains(
                                    normalizedQuery)
                            )
                        ))
                    .OrderBy(task =>
                        task.Title)
                    .Take(
                        remainingAfterProjects)
                    .Select(task =>
                        new GlobalSearchResultDto
                        {
                            Type = "Task",
                            Id = task.Id,
                            Title = task.Title,
                            Subtitle =
                                task.Description,
                            RelatedId =
                                task.ProjectId,
                            RelatedName =
                                task.Project.Name
                        })
                    .ToListAsync(
                        cancellationToken);

            results.AddRange(tasks);
        }

        var remainingAfterTasks =
            Math.Max(
                0,
                take - results.Count);

        if (remainingAfterTasks > 0)
        {
            var users =
                await _context.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.IsActive &&
                        !user.IsDeleted &&
                        (
                            user.FirstName.Contains(
                                normalizedQuery) ||
                            user.LastName.Contains(
                                normalizedQuery) ||
                            user.Email.Contains(
                                normalizedQuery) ||
                            (
                                user.Department != null &&
                                user.Department.Contains(
                                    normalizedQuery)
                            )
                        ))
                    .OrderBy(user =>
                        user.FirstName)
                    .ThenBy(user =>
                        user.LastName)
                    .Take(
                        remainingAfterTasks)
                    .Select(user =>
                        new GlobalSearchResultDto
                        {
                            Type = "User",
                            Id = user.Id,

                            Title =
                                (user.FirstName +
                                 " " +
                                 user.LastName)
                                .Trim(),

                            Subtitle =
                                user.Email,

                            RelatedId =
                                user.DepartmentId,

                            RelatedName =
                                user.DepartmentEntity != null
                                    ? user.DepartmentEntity.Name
                                    : user.Department
                        })
                    .ToListAsync(
                        cancellationToken);

            results.AddRange(users);
        }

        var remainingAfterUsers =
            Math.Max(
                0,
                take - results.Count);

        if (remainingAfterUsers > 0)
        {
            var departments =
                await _context.Departments
                    .AsNoTracking()
                    .Where(department =>
                        department.IsActive &&
                        !department.IsDeleted &&
                        (
                            department.Name.Contains(
                                normalizedQuery) ||
                            (
                                department.Description != null &&
                                department.Description.Contains(
                                    normalizedQuery)
                            )
                        ))
                    .OrderBy(department =>
                        department.Name)
                    .Take(
                        remainingAfterUsers)
                    .Select(department =>
                        new GlobalSearchResultDto
                        {
                            Type = "Department",
                            Id = department.Id,
                            Title = department.Name,
                            Subtitle =
                                department.Description,
                            RelatedId =
                                department.ManagerId,
                            RelatedName =
                                department.Manager != null
                                    ? department.Manager.FirstName +
                                      " " +
                                      department.Manager.LastName
                                    : null
                        })
                    .ToListAsync(
                        cancellationToken);

            results.AddRange(departments);
        }

        return new GlobalSearchResponseDto
        {
            Query = normalizedQuery,
            Results = results,
            TotalCount = results.Count
        };
    }

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        if (isAdmin)
        {
            return await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    !project.IsDeleted)
                .Select(project =>
                    project.Id)
                .ToListAsync(
                    cancellationToken);
        }

        var ownedProjectIds =
            await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    project.OwnerId ==
                        currentUserId &&
                    !project.IsDeleted)
                .Select(project =>
                    project.Id)
                .ToListAsync(
                    cancellationToken);

        var memberProjectIds =
            await _context.ProjectMembers
                .AsNoTracking()
                .Where(member =>
                    member.UserId ==
                        currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted)
                .Select(member =>
                    member.ProjectId)
                .ToListAsync(
                    cancellationToken);

        return ownedProjectIds
            .Concat(memberProjectIds)
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
}