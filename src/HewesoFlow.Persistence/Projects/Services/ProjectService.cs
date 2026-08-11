using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.Projects;
using HewesoFlow.Application.Features.Projects.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Projects.Services;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;

    public ProjectService(
        IUnitOfWork unitOfWork,
        AppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<ProjectResponseDto> CreateAsync(
        CreateProjectRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var canCreateProject =
            await IsAdminOrProjectManagerAsync(
                currentUserId,
                cancellationToken);

        if (!canCreateProject)
        {
            throw new UnauthorizedAccessException(
                "Proje oluşturma yetkiniz bulunmamaktadır.");
        }

        var projectName =
            request.Name?.Trim() ?? string.Empty;

        ValidateProjectName(projectName);

        var ownerExists =
            await _unitOfWork.Users.AnyAsync(
                user =>
                    user.Id == currentUserId &&
                    user.IsActive &&
                    !user.IsDeleted,
                cancellationToken);

        if (!ownerExists)
        {
            throw new InvalidOperationException(
                "Projeyi oluşturacak aktif kullanıcı bulunamadı.");
        }

        var startDate =
            request.StartDate ?? DateTime.UtcNow;

        ValidateProjectDates(
            startDate,
            request.EndDate);

        var project = new Project
        {
            Name = projectName,

            Description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim(),

            StartDate = startDate,
            EndDate = request.EndDate,
            Status = ProjectStatus.Planning,
            OwnerId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null,
            IsDeleted = false
        };

        await _unitOfWork.Projects.AddAsync(
            project,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return MapToResponse(project);
    }

    public async Task<IReadOnlyList<ProjectListDto>> GetAllAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        if (isAdmin)
        {
            var allProjects =
                await _unitOfWork.Projects.FindAsync(
                    project =>
                        !project.IsDeleted,
                    cancellationToken);

            return allProjects
                .OrderByDescending(
                    project => project.CreatedAt)
                .Select(MapToList)
                .ToList();
        }

        var ownedProjects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    project.OwnerId == currentUserId &&
                    !project.IsDeleted,
                cancellationToken);

        var projectMemberships =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var memberProjectIds =
            projectMemberships
                .Select(member => member.ProjectId)
                .ToHashSet();

        var memberProjects =
            memberProjectIds.Count == 0
                ? []
                : await _unitOfWork.Projects.FindAsync(
                    project =>
                        memberProjectIds.Contains(project.Id) &&
                        !project.IsDeleted,
                    cancellationToken);

        return ownedProjects
            .Concat(memberProjects)
            .GroupBy(project => project.Id)
            .Select(group => group.First())
            .OrderByDescending(
                project => project.CreatedAt)
            .Select(MapToList)
            .ToList();
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == id &&
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

        if (isAdmin)
        {
            return MapToResponse(project);
        }

        var userOwnsProject =
            project.OwnerId == currentUserId;

        var userIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == id &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!userOwnsProject &&
            !userIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu projeyi görüntüleme yetkiniz bulunmamaktadır.");
        }

        return MapToResponse(project);
    }

    public async Task<ProjectResponseDto?> UpdateAsync(
        UpdateProjectRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == request.Id &&
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

        var userOwnsProject =
            project.OwnerId == currentUserId;

        if (!isAdmin &&
            (!isProjectManager || !userOwnsProject))
        {
            throw new UnauthorizedAccessException(
                "Bu projeyi güncelleme yetkiniz bulunmamaktadır.");
        }

        var projectName =
            request.Name?.Trim() ?? string.Empty;

        ValidateProjectName(projectName);

        var startDate =
            request.StartDate ?? project.StartDate;

        ValidateProjectDates(
            startDate,
            request.EndDate);

        project.Name = projectName;

        project.Description =
            string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

        project.StartDate = startDate;
        project.EndDate = request.EndDate;
        project.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Projects.Update(project);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return MapToResponse(project);
    }

    public async Task<bool> DeleteAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == id &&
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

        var userOwnsProject =
            project.OwnerId == currentUserId;

        if (!isAdmin &&
            (!isProjectManager || !userOwnsProject))
        {
            throw new UnauthorizedAccessException(
                "Bu projeyi silme yetkiniz bulunmamaktadır.");
        }

        project.IsDeleted = true;
        project.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Projects.Update(project);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<ProjectSummaryDto?> GetSummaryAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectId &&
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

        var userOwnsProject =
            project.OwnerId == currentUserId;

        var userIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == projectId &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!isAdmin &&
            !userOwnsProject &&
            !userIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu projenin özet bilgilerini görüntüleme yetkiniz bulunmamaktadır.");
        }

        var projectTasks =
            await _unitOfWork.ProjectTasks.FindAsync(
                projectTask =>
                    projectTask.ProjectId == projectId &&
                    !projectTask.IsDeleted,
                cancellationToken);

        var totalTasks =
            projectTasks.Count;

        var todoTasks =
            projectTasks.Count(
                projectTask =>
                    projectTask.Status ==
                    ProjectTaskStatus.Todo);

        var inProgressTasks =
            projectTasks.Count(
                projectTask =>
                    projectTask.Status ==
                    ProjectTaskStatus.InProgress);

        var inReviewTasks =
            projectTasks.Count(
                projectTask =>
                    projectTask.Status ==
                    ProjectTaskStatus.InReview);

        var completedTasks =
            projectTasks.Count(
                projectTask =>
                    projectTask.Status ==
                    ProjectTaskStatus.Done);

        var now =
            DateTime.UtcNow;

        var overdueTasks =
            projectTasks.Count(
                projectTask =>
                    projectTask.DueDate.HasValue &&
                    projectTask.DueDate.Value < now &&
                    projectTask.Status !=
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
            ProjectId = project.Id,
            ProjectName = project.Name,
            TotalTasks = totalTasks,
            TodoTasks = todoTasks,
            InProgressTasks = inProgressTasks,
            InReviewTasks = inReviewTasks,
            CompletedTasks = completedTasks,
            OverdueTasks = overdueTasks,
            CompletionPercentage = completionPercentage
        };
    }

    private async Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                userRole =>
                    userRole.UserId == userId &&
                    userRole.IsActive &&
                    !userRole.IsDeleted &&
                    userRole.Role.IsActive &&
                    !userRole.Role.IsDeleted &&
                    userRole.Role.Name == "Admin",
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
                    userRole.UserId == userId &&
                    userRole.IsActive &&
                    !userRole.IsDeleted &&
                    userRole.Role.IsActive &&
                    !userRole.Role.IsDeleted &&
                    userRole.Role.Name == "ProjectManager",
                cancellationToken);
    }

    private async Task<bool> IsAdminOrProjectManagerAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                userRole =>
                    userRole.UserId == userId &&
                    userRole.IsActive &&
                    !userRole.IsDeleted &&
                    userRole.Role.IsActive &&
                    !userRole.Role.IsDeleted &&
                    (
                        userRole.Role.Name == "Admin" ||
                        userRole.Role.Name == "ProjectManager"
                    ),
                cancellationToken);
    }

    private static void ValidateProjectName(
        string projectName)
    {
        if (string.IsNullOrWhiteSpace(projectName))
        {
            throw new ArgumentException(
                "Proje adı boş bırakılamaz.");
        }

        if (projectName.Length < 3)
        {
            throw new ArgumentException(
                "Proje adı en az 3 karakter olmalıdır.");
        }

        if (projectName.Length > 150)
        {
            throw new ArgumentException(
                "Proje adı en fazla 150 karakter olabilir.");
        }
    }

    private static void ValidateProjectDates(
        DateTime startDate,
        DateTime? endDate)
    {
        if (endDate.HasValue &&
            endDate.Value < startDate)
        {
            throw new ArgumentException(
                "Projenin bitiş tarihi başlangıç tarihinden önce olamaz.");
        }
    }

    private static ProjectResponseDto MapToResponse(
        Project project)
    {
        return new ProjectResponseDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Status = project.Status,
            OwnerId = project.OwnerId,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }

    private static ProjectListDto MapToList(
        Project project)
    {
        return new ProjectListDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Status = project.Status,
            OwnerId = project.OwnerId,
            CreatedAt = project.CreatedAt
        };
    }
}