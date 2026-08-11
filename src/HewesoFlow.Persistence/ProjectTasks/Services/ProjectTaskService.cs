using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.ProjectTasks.Services;

public class ProjectTaskService : IProjectTaskService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProjectTaskService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProjectTaskResponseDto> CreateAsync(
        CreateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var title = request.Title.Trim();
        var description = request.Description.Trim();

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Görev başlığı boş bırakılamaz.");
        }

        if (title.Length < 3)
        {
            throw new ArgumentException(
                "Görev başlığı en az 3 karakter olmalıdır.");
        }

        if (title.Length > 200)
        {
            throw new ArgumentException(
                "Görev başlığı en fazla 200 karakter olabilir.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException(
                "Görev açıklaması boş bırakılamaz.");
        }

        if (description.Length < 3)
        {
            throw new ArgumentException(
                "Görev açıklaması en az 3 karakter olmalıdır.");
        }

        if (description.Length > 2000)
        {
            throw new ArgumentException(
                "Görev açıklaması en fazla 2000 karakter olabilir.");
        }

        if (!Enum.IsDefined(
                typeof(TaskPriority),
                request.Priority))
        {
            throw new ArgumentException(
                "Geçersiz görev önceliği gönderildi.");
        }

        var currentUserExists =
            await _unitOfWork.Users.AnyAsync(
                user =>
                    user.Id == currentUserId &&
                    user.IsActive &&
                    !user.IsDeleted,
                cancellationToken);

        if (!currentUserExists)
        {
            throw new InvalidOperationException(
                "Görevi oluşturacak aktif kullanıcı bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == request.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Görevin ekleneceği proje bulunamadı.");
        }

        var currentUserIsProjectOwner =
            project.OwnerId == currentUserId;

        var currentUserIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == request.ProjectId &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!currentUserIsProjectOwner &&
            !currentUserIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu projede görev oluşturma yetkiniz bulunmamaktadır.");
        }

        ValidateDueDate(
            request.DueDate,
            project);

        if (request.AssignedUserId.HasValue)
        {
            await ValidateAssignedUserAsync(
                request.ProjectId,
                request.AssignedUserId.Value,
                cancellationToken);
        }

        var projectTask = new ProjectTask
        {
            Title = title,
            Description = description,

            ProjectId = request.ProjectId,
            AssignedUserId = request.AssignedUserId,
            CreatedByUserId = currentUserId,

            Status = ProjectTaskStatus.Todo,
            Priority = request.Priority,

            DueDate = request.DueDate,
            CompletedAt = null,

            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _unitOfWork.ProjectTasks.AddAsync(
            projectTask,
            cancellationToken);

        await AddHistoryAsync(
            projectTask.Id,
            currentUserId,
            "Görev oluşturuldu",
            null,
            projectTask.Title,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return await MapToResponseAsync(
            projectTask,
            cancellationToken);
    }

    public async Task<IReadOnlyList<ProjectTaskResponseDto>> GetAllAsync(
        ProjectTaskFilterDto filter,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (filter.Page < 1)
        {
            filter.Page = 1;
        }

        if (filter.PageSize < 1)
        {
            filter.PageSize = 10;
        }

        if (filter.PageSize > 100)
        {
            filter.PageSize = 100;
        }

        var ownedProjects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    project.OwnerId == currentUserId &&
                    !project.IsDeleted,
                cancellationToken);

        var memberProjects =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var accessibleProjectIds =
            ownedProjects
                .Select(project => project.Id)
                .Concat(
                    memberProjects.Select(
                        member => member.ProjectId))
                .Distinct()
                .ToHashSet();

        var projectTasks =
            await _unitOfWork.ProjectTasks.FindAsync(
                projectTask =>
                    !projectTask.IsDeleted &&
                    accessibleProjectIds.Contains(
                        projectTask.ProjectId),
                cancellationToken);

        var query = projectTasks.AsEnumerable();

        if (filter.ProjectId.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.ProjectId ==
                    filter.ProjectId.Value);
        }

        if (filter.AssignedUserId.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.AssignedUserId ==
                    filter.AssignedUserId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.Status ==
                    filter.Status.Value);
        }

        if (filter.Priority.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.Priority ==
                    filter.Priority.Value);
        }

        if (filter.DueBefore.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.DueDate.HasValue &&
                    projectTask.DueDate.Value <=
                    filter.DueBefore.Value);
        }

        if (filter.DueAfter.HasValue)
        {
            query = query.Where(
                projectTask =>
                    projectTask.DueDate.HasValue &&
                    projectTask.DueDate.Value >=
                    filter.DueAfter.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.QuickFilter))
        {
            var quickFilter =
                filter.QuickFilter
                    .Trim()
                    .ToLowerInvariant();

            var today =
                DateTime.UtcNow.Date;

            query = quickFilter switch
            {
                "assigned-to-me" =>
                    query.Where(
                        projectTask =>
                            projectTask.AssignedUserId ==
                            currentUserId),

                "overdue" =>
                    query.Where(
                        projectTask =>
                            projectTask.DueDate.HasValue &&
                            projectTask.DueDate.Value <
                            DateTime.UtcNow &&
                            projectTask.Status !=
                            ProjectTaskStatus.Done),

                "due-today" =>
                    query.Where(
                        projectTask =>
                            projectTask.DueDate.HasValue &&
                            projectTask.DueDate.Value.Date ==
                            today &&
                            projectTask.Status !=
                            ProjectTaskStatus.Done),

                "high-priority" =>
                    query.Where(
                        projectTask =>
                            projectTask.Priority ==
                            TaskPriority.High ||
                            projectTask.Priority ==
                            TaskPriority.Critical),

                "completed" =>
                    query.Where(
                        projectTask =>
                            projectTask.Status ==
                            ProjectTaskStatus.Done),

                _ => query
            };
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchText =
                filter.Search.Trim();

            query = query.Where(
                projectTask =>
                    projectTask.Title.Contains(
                        searchText,
                        StringComparison.OrdinalIgnoreCase) ||
                    (
                        projectTask.Description != null &&
                        projectTask.Description.Contains(
                            searchText,
                            StringComparison.OrdinalIgnoreCase)
                    ));
        }

        var filteredTasks =
            query
                .OrderByDescending(
                    projectTask =>
                        projectTask.CreatedAt)
                .Skip(
                    (filter.Page - 1) *
                    filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

        var result =
            new List<ProjectTaskResponseDto>();

        foreach (var projectTask in filteredTasks)
        {
            result.Add(
                await MapToResponseAsync(
                    projectTask,
                    cancellationToken));
        }

        return result;
    }

    public async Task<ProjectTaskResponseDto> GetByIdAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var projectTask =
            await GetAccessibleTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        return await MapToResponseAsync(
            projectTask,
            cancellationToken);
    }

    public async Task<ProjectTaskResponseDto> UpdateAsync(
        Guid taskId,
        UpdateProjectTaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var projectTask =
            await GetManageableTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        var title = request.Title.Trim();
        var description = request.Description.Trim();

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Görev başlığı boş bırakılamaz.");
        }

        if (title.Length < 3)
        {
            throw new ArgumentException(
                "Görev başlığı en az 3 karakter olmalıdır.");
        }

        if (title.Length > 200)
        {
            throw new ArgumentException(
                "Görev başlığı en fazla 200 karakter olabilir.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException(
                "Görev açıklaması boş bırakılamaz.");
        }

        if (description.Length < 3)
        {
            throw new ArgumentException(
                "Görev açıklaması en az 3 karakter olmalıdır.");
        }

        if (description.Length > 2000)
        {
            throw new ArgumentException(
                "Görev açıklaması en fazla 2000 karakter olabilir.");
        }

        if (!Enum.IsDefined(
                typeof(TaskPriority),
                request.Priority))
        {
            throw new ArgumentException(
                "Geçersiz görev önceliği gönderildi.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        ValidateDueDate(
            request.DueDate,
            project);

        if (request.AssignedUserId.HasValue)
        {
            await ValidateAssignedUserAsync(
                projectTask.ProjectId,
                request.AssignedUserId.Value,
                cancellationToken);
        }

        var oldTitle =
            projectTask.Title;

        var oldDescription =
            projectTask.Description;

        var oldAssignedUserId =
            projectTask.AssignedUserId;

        var oldPriority =
            projectTask.Priority;

        var oldDueDate =
            projectTask.DueDate;

        if (oldTitle != title)
        {
            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görev başlığı değiştirildi",
                oldTitle,
                title,
                cancellationToken);
        }

        if (oldDescription != description)
        {
            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görev açıklaması değiştirildi",
                oldDescription,
                description,
                cancellationToken);
        }

        if (oldPriority != request.Priority)
        {
            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görev önceliği değiştirildi",
                GetPriorityText(oldPriority),
                GetPriorityText(
                    request.Priority),
                cancellationToken);
        }

        if (oldAssignedUserId !=
            request.AssignedUserId)
        {
            var oldAssignedUserName =
                await GetUserFullNameAsync(
                    oldAssignedUserId,
                    cancellationToken);

            var newAssignedUserName =
                await GetUserFullNameAsync(
                    request.AssignedUserId,
                    cancellationToken);

            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görevin atandığı kullanıcı değiştirildi",
                oldAssignedUserName,
                newAssignedUserName,
                cancellationToken);
        }

        if (oldDueDate != request.DueDate)
        {
            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görev teslim tarihi değiştirildi",
                FormatDate(oldDueDate),
                FormatDate(
                    request.DueDate),
                cancellationToken);
        }

        projectTask.Title =
            title;

        projectTask.Description =
            description;

        projectTask.AssignedUserId =
            request.AssignedUserId;

        projectTask.Priority =
            request.Priority;

        projectTask.DueDate =
            request.DueDate;

        projectTask.UpdatedAt =
            DateTime.UtcNow;

        _unitOfWork.ProjectTasks.Update(
            projectTask);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return await MapToResponseAsync(
            projectTask,
            cancellationToken);
    }

    public async Task<ProjectTaskResponseDto> UpdateStatusAsync(
        Guid taskId,
        UpdateProjectTaskStatusRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var projectTask =
            await GetAccessibleTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        if (!Enum.IsDefined(
                typeof(ProjectTaskStatus),
                request.Status))
        {
            throw new ArgumentException(
                "Geçersiz görev durumu gönderildi.");
        }

        var oldStatus =
            projectTask.Status;

        if (oldStatus != request.Status)
        {
            await AddHistoryAsync(
                projectTask.Id,
                currentUserId,
                "Görev durumu değiştirildi",
                GetStatusText(oldStatus),
                GetStatusText(
                    request.Status),
                cancellationToken);
        }

        projectTask.Status =
            request.Status;

        projectTask.UpdatedAt =
            DateTime.UtcNow;

        projectTask.CompletedAt =
            request.Status ==
            ProjectTaskStatus.Done
                ? DateTime.UtcNow
                : null;

        _unitOfWork.ProjectTasks.Update(
            projectTask);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return await MapToResponseAsync(
            projectTask,
            cancellationToken);
    }

    public async Task DeleteAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var projectTask =
            await GetManageableTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        await AddHistoryAsync(
            projectTask.Id,
            currentUserId,
            "Görev silindi",
            projectTask.Title,
            null,
            cancellationToken);

        projectTask.IsDeleted =
            true;

        projectTask.UpdatedAt =
            DateTime.UtcNow;

        _unitOfWork.ProjectTasks.Update(
            projectTask);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);
    }

    private async Task AddHistoryAsync(
        Guid projectTaskId,
        Guid userId,
        string action,
        string? oldValue,
        string? newValue,
        CancellationToken cancellationToken)
    {
        var history =
            new TaskHistory
            {
                ProjectTaskId =
                    projectTaskId,

                UserId =
                    userId,

                Action =
                    action,

                OldValue =
                    oldValue,

                NewValue =
                    newValue,

                CreatedOn =
                    DateTime.UtcNow,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _unitOfWork.TaskHistories.AddAsync(
            history,
            cancellationToken);
    }

    private async Task ValidateAssignedUserAsync(
        Guid projectId,
        Guid assignedUserId,
        CancellationToken cancellationToken)
    {
        var userExists =
            await _unitOfWork.Users.AnyAsync(
                user =>
                    user.Id == assignedUserId &&
                    user.IsActive &&
                    !user.IsDeleted,
                cancellationToken);

        if (!userExists)
        {
            throw new InvalidOperationException(
                "Görevin atanacağı aktif kullanıcı bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        var userIsProjectOwner =
            project.OwnerId == assignedUserId;

        var userIsActiveMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == projectId &&
                    member.UserId == assignedUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!userIsProjectOwner &&
            !userIsActiveMember)
        {
            throw new InvalidOperationException(
                "Görev atanacak kullanıcı projenin aktif bir üyesi değildir.");
        }
    }

    private async Task<ProjectTask> GetAccessibleTaskAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                projectTask =>
                    projectTask.Id == taskId &&
                    !projectTask.IsDeleted,
                cancellationToken);

        if (projectTask is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        var userIsProjectOwner =
            project.OwnerId == currentUserId;

        var userIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == projectTask.ProjectId &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!userIsProjectOwner &&
            !userIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu görevi görüntüleme veya değiştirme yetkiniz bulunmamaktadır.");
        }

        return projectTask;
    }

    private async Task<ProjectTask> GetManageableTaskAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                projectTask =>
                    projectTask.Id == taskId &&
                    !projectTask.IsDeleted,
                cancellationToken);

        if (projectTask is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        if (project.OwnerId != currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Bu görevi yönetme yetkiniz bulunmamaktadır.");
        }

        return projectTask;
    }

    private async Task<string> GetUserFullNameAsync(
        Guid? userId,
        CancellationToken cancellationToken)
    {
        if (!userId.HasValue)
        {
            return "Atanmamış";
        }

        var user =
            await _unitOfWork.Users.FirstOrDefaultAsync(
                user =>
                    user.Id == userId.Value,
                cancellationToken);

        if (user is null)
        {
            return "Bilinmeyen kullanıcı";
        }

        return
            $"{user.FirstName} {user.LastName}";
    }

    private async Task<ProjectTaskResponseDto> MapToResponseAsync(
        ProjectTask projectTask,
        CancellationToken cancellationToken)
    {
        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId,
                cancellationToken);

        var createdByUser =
            await _unitOfWork.Users.FirstOrDefaultAsync(
                user =>
                    user.Id == projectTask.CreatedByUserId,
                cancellationToken);

        User? assignedUser = null;

        if (projectTask.AssignedUserId.HasValue)
        {
            assignedUser =
                await _unitOfWork.Users.FirstOrDefaultAsync(
                    user =>
                        user.Id ==
                        projectTask.AssignedUserId.Value,
                    cancellationToken);
        }

        var now =
            DateTime.UtcNow;

        var isOverdue =
            projectTask.DueDate.HasValue &&
            projectTask.DueDate.Value < now &&
            projectTask.Status !=
            ProjectTaskStatus.Done;

        int? daysRemaining = null;

        if (projectTask.DueDate.HasValue)
        {
            daysRemaining =
                (
                    projectTask.DueDate.Value.Date -
                    now.Date
                ).Days;
        }

        return new ProjectTaskResponseDto
        {
            Id =
                projectTask.Id,

            Title =
                projectTask.Title,

            Description =
                projectTask.Description,

            ProjectId =
                projectTask.ProjectId,

            ProjectName =
                project?.Name ??
                string.Empty,

            AssignedUserId =
                projectTask.AssignedUserId,

            AssignedUserFullName =
                assignedUser is null
                    ? null
                    : $"{assignedUser.FirstName} {assignedUser.LastName}",

            CreatedByUserId =
                projectTask.CreatedByUserId,

            CreatedByUserFullName =
                createdByUser is null
                    ? string.Empty
                    : $"{createdByUser.FirstName} {createdByUser.LastName}",

            Status =
                projectTask.Status,

            Priority =
                projectTask.Priority,

            DueDate =
                projectTask.DueDate,

            CompletedAt =
                projectTask.CompletedAt,

            IsOverdue =
                isOverdue,

            DaysRemaining =
                daysRemaining,

            CreatedAt =
                projectTask.CreatedAt,

            UpdatedAt =
                projectTask.UpdatedAt
        };
    }

    private static void ValidateDueDate(
        DateTime? dueDate,
        Project project)
    {
        if (dueDate.HasValue &&
            dueDate.Value < project.StartDate)
        {
            throw new ArgumentException(
                "Görev teslim tarihi proje başlangıç tarihinden önce olamaz.");
        }

        if (project.EndDate.HasValue &&
            dueDate.HasValue &&
            dueDate.Value > project.EndDate.Value)
        {
            throw new ArgumentException(
                "Görev teslim tarihi proje bitiş tarihinden sonra olamaz.");
        }
    }

    private static string GetStatusText(
        ProjectTaskStatus status)
    {
        return status switch
        {
            ProjectTaskStatus.Todo =>
                "Yapılacak",

            ProjectTaskStatus.InProgress =>
                "Devam ediyor",

            ProjectTaskStatus.InReview =>
                "İncelemede",

            ProjectTaskStatus.Done =>
                "Tamamlandı",

            _ =>
                status.ToString()
        };
    }

    private static string GetPriorityText(
        TaskPriority priority)
    {
        return priority switch
        {
            TaskPriority.Low =>
                "Düşük",

            TaskPriority.Medium =>
                "Orta",

            TaskPriority.High =>
                "Yüksek",

            TaskPriority.Critical =>
                "Kritik",

            _ =>
                priority.ToString()
        };
    }

    private static string FormatDate(
        DateTime? date)
    {
        return date.HasValue
            ? date.Value.ToString(
                "dd.MM.yyyy HH:mm")
            : "Belirtilmemiş";
    }
}