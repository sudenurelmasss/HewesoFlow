using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.ProjectTasks.Services;

public class TaskAdvancedService : ITaskAdvancedService
{
    private readonly AppDbContext _context;

    public TaskAdvancedService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<SubtaskDto> CreateSubtaskAsync(
        Guid parentTaskId,
        CreateSubtaskRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var parentTask =
            await GetManageableTaskAsync(
                parentTaskId,
                currentUserId,
                cancellationToken);

        if (parentTask.ParentTaskId.HasValue)
        {
            throw new InvalidOperationException(
                "Bir alt görevin altında tekrar alt görev oluşturulamaz.");
        }

        var title =
            request.Title?.Trim() ??
            string.Empty;

        ValidateTitle(title);

        var description =
            request.Description?.Trim() ??
            string.Empty;

        ValidateDescription(
            description);

        if (!Enum.IsDefined(
                typeof(TaskPriority),
                request.Priority))
        {
            throw new ArgumentException(
                "Geçersiz görev önceliği.");
        }

        if (request.AssignedUserId.HasValue)
        {
            await ValidateAssignedUserAsync(
                parentTask.ProjectId,
                request.AssignedUserId.Value,
                cancellationToken);
        }

        ValidateDueDate(
            request.DueDate,
            parentTask);

        var subtask =
            new ProjectTask
            {
                Id =
                    Guid.NewGuid(),

                ParentTaskId =
                    parentTask.Id,

                ProjectId =
                    parentTask.ProjectId,

                Title =
                    title,

                Description =
                    description,

                AssignedUserId =
                    request.AssignedUserId,

                CreatedByUserId =
                    currentUserId,

                Priority =
                    request.Priority,

                Status =
                    ProjectTaskStatus.Todo,

                DueDate =
                    request.DueDate,

                CompletedAt =
                    null,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _context.ProjectTasks.AddAsync(
            subtask,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return MapSubtask(
            subtask);
    }

    public async Task<IReadOnlyList<SubtaskDto>>
        GetSubtasksAsync(
            Guid parentTaskId,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            parentTaskId,
            currentUserId,
            cancellationToken);

        return await _context.ProjectTasks
            .AsNoTracking()
            .Where(task =>
                task.ParentTaskId ==
                    parentTaskId &&
                !task.IsDeleted)
            .OrderBy(task =>
                task.CreatedAt)
            .Select(task =>
                new SubtaskDto
                {
                    Id =
                        task.Id,

                    ParentTaskId =
                        parentTaskId,

                    ProjectId =
                        task.ProjectId,

                    Title =
                        task.Title,

                    Description =
                        task.Description,

                    AssignedUserId =
                        task.AssignedUserId,

                    Status =
                        task.Status,

                    Priority =
                        task.Priority,

                    DueDate =
                        task.DueDate,

                    CreatedAt =
                        task.CreatedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<ChecklistItemDto>
        CreateChecklistItemAsync(
            Guid taskId,
            CreateChecklistItemRequestDto request,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        await GetManageableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var title =
            request.Title?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                title))
        {
            throw new ArgumentException(
                "Checklist maddesi boş bırakılamaz.");
        }

        if (title.Length > 250)
        {
            throw new ArgumentException(
                "Checklist maddesi en fazla 250 karakter olabilir.");
        }

        var item =
            new TaskChecklistItem
            {
                Id =
                    Guid.NewGuid(),

                ProjectTaskId =
                    taskId,

                Title =
                    title,

                SortOrder =
                    request.SortOrder,

                IsCompleted =
                    false,

                CompletedAt =
                    null,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        await _context.TaskChecklistItems.AddAsync(
            item,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return MapChecklist(
            item);
    }

    public async Task<IReadOnlyList<ChecklistItemDto>>
        GetChecklistAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        return await _context.TaskChecklistItems
            .AsNoTracking()
            .Where(item =>
                item.ProjectTaskId ==
                    taskId &&
                !item.IsDeleted)
            .OrderBy(item =>
                item.SortOrder)
            .ThenBy(item =>
                item.CreatedAt)
            .Select(item =>
                new ChecklistItemDto
                {
                    Id =
                        item.Id,

                    ProjectTaskId =
                        item.ProjectTaskId,

                    Title =
                        item.Title,

                    IsCompleted =
                        item.IsCompleted,

                    SortOrder =
                        item.SortOrder,

                    CompletedAt =
                        item.CompletedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<ChecklistItemDto>
        UpdateChecklistItemAsync(
            Guid taskId,
            Guid itemId,
            UpdateChecklistItemRequestDto request,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        await GetProgressEditableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var item =
            await _context.TaskChecklistItems
                .FirstOrDefaultAsync(
                    item =>
                        item.Id ==
                            itemId &&
                        item.ProjectTaskId ==
                            taskId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (item is null)
        {
            throw new KeyNotFoundException(
                "Checklist maddesi bulunamadı.");
        }

        if (!string.IsNullOrWhiteSpace(
                request.Title))
        {
            var title =
                request.Title.Trim();

            if (title.Length > 250)
            {
                throw new ArgumentException(
                    "Checklist maddesi en fazla 250 karakter olabilir.");
            }

            item.Title =
                title;
        }

        item.IsCompleted =
            request.IsCompleted;

        item.CompletedAt =
            request.IsCompleted
                ? DateTime.UtcNow
                : null;

        if (request.SortOrder.HasValue)
        {
            item.SortOrder =
                request.SortOrder.Value;
        }

        item.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return MapChecklist(
            item);
    }

    public async Task DeleteChecklistItemAsync(
        Guid taskId,
        Guid itemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetManageableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var item =
            await _context.TaskChecklistItems
                .FirstOrDefaultAsync(
                    item =>
                        item.Id ==
                            itemId &&
                        item.ProjectTaskId ==
                            taskId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (item is null)
        {
            throw new KeyNotFoundException(
                "Checklist maddesi bulunamadı.");
        }

        item.IsDeleted =
            true;

        item.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task<TaskTagDto> AddTagAsync(
        Guid taskId,
        CreateTaskTagRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetManageableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var name =
            request.Name?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                name))
        {
            throw new ArgumentException(
                "Etiket adı boş bırakılamaz.");
        }

        if (name.Length > 50)
        {
            throw new ArgumentException(
                "Etiket adı en fazla 50 karakter olabilir.");
        }

        var tag =
            await _context.Tags
                .FirstOrDefaultAsync(
                    tag =>
                        tag.Name ==
                            name &&
                        !tag.IsDeleted,
                    cancellationToken);

        if (tag is null)
        {
            tag =
                new Tag
                {
                    Id =
                        Guid.NewGuid(),

                    Name =
                        name,

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            await _context.Tags.AddAsync(
                tag,
                cancellationToken);
        }

        var existingRelation =
            await _context.ProjectTaskTags
                .FirstOrDefaultAsync(
                    relation =>
                        relation.ProjectTaskId ==
                            taskId &&
                        relation.TagId ==
                            tag.Id,
                    cancellationToken);

        if (existingRelation is null)
        {
            var relation =
                new ProjectTaskTag
                {
                    Id =
                        Guid.NewGuid(),

                    ProjectTaskId =
                        taskId,

                    TagId =
                        tag.Id,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            await _context.ProjectTaskTags.AddAsync(
                relation,
                cancellationToken);
        }
        else
        {
            existingRelation.IsDeleted =
                false;

            existingRelation.UpdatedAt =
                DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        return new TaskTagDto
        {
            Id =
                tag.Id,

            Name =
                tag.Name
        };
    }

    public async Task<IReadOnlyList<TaskTagDto>>
        GetTagsAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        return await _context.ProjectTaskTags
            .AsNoTracking()
            .Where(relation =>
                relation.ProjectTaskId ==
                    taskId &&
                !relation.IsDeleted &&
                !relation.Tag.IsDeleted &&
                relation.Tag.IsActive)
            .OrderBy(relation =>
                relation.Tag.Name)
            .Select(relation =>
                new TaskTagDto
                {
                    Id =
                        relation.Tag.Id,

                    Name =
                        relation.Tag.Name
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task RemoveTagAsync(
        Guid taskId,
        Guid tagId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetManageableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var relation =
            await _context.ProjectTaskTags
                .FirstOrDefaultAsync(
                    relation =>
                        relation.ProjectTaskId ==
                            taskId &&
                        relation.TagId ==
                            tagId &&
                        !relation.IsDeleted,
                    cancellationToken);

        if (relation is null)
        {
            throw new KeyNotFoundException(
                "Görev etiketi bulunamadı.");
        }

        relation.IsDeleted =
            true;

        relation.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    private async Task<ProjectTask>
        GetAccessibleTaskAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken)
    {
        var task =
            await GetTaskAsync(
                taskId,
                cancellationToken);

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return task;
        }

        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            task.ProjectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (project.OwnerId ==
            currentUserId)
        {
            return task;
        }

        var member =
            await _context.ProjectMembers
                .AnyAsync(
                    member =>
                        member.ProjectId ==
                            task.ProjectId &&
                        member.UserId ==
                            currentUserId &&
                        member.IsActive &&
                        !member.IsDeleted,
                    cancellationToken);

        if (!member)
        {
            throw new UnauthorizedAccessException(
                "Bu göreve erişim yetkiniz bulunmamaktadır.");
        }

        return task;
    }

    private async Task<ProjectTask>
        GetManageableTaskAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken)
    {
        var task =
            await GetTaskAsync(
                taskId,
                cancellationToken);

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return task;
        }

        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            task.ProjectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (project.OwnerId !=
            currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Bu görevi yönetme yetkiniz bulunmamaktadır.");
        }

        return task;
    }

    private async Task<ProjectTask>
        GetProgressEditableTaskAsync(
            Guid taskId,
            Guid currentUserId,
            CancellationToken cancellationToken)
    {
        var task =
            await GetTaskAsync(
                taskId,
                cancellationToken);

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return task;
        }

        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            task.ProjectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (project.OwnerId ==
            currentUserId)
        {
            return task;
        }

        if (task.AssignedUserId ==
            currentUserId)
        {
            return task;
        }

        throw new UnauthorizedAccessException(
            "Checklist durumunu değiştirme yetkiniz bulunmamaktadır.");
    }

    private async Task<ProjectTask> GetTaskAsync(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var task =
            await _context.ProjectTasks
                .FirstOrDefaultAsync(
                    task =>
                        task.Id ==
                            taskId &&
                        !task.IsDeleted,
                    cancellationToken);

        if (task is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        return task;
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

    private async Task ValidateAssignedUserAsync(
        Guid projectId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user =
            await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    user =>
                        user.Id ==
                            userId &&
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Aktif kullanıcı bulunamadı.");
        }

        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        if (project.OwnerId ==
            userId)
        {
            return;
        }

        var member =
            await _context.ProjectMembers
                .AnyAsync(
                    member =>
                        member.ProjectId ==
                            projectId &&
                        member.UserId ==
                            userId &&
                        member.IsActive &&
                        !member.IsDeleted,
                    cancellationToken);

        if (!member)
        {
            throw new InvalidOperationException(
                "Alt görev atanacak kullanıcı proje üyesi değildir.");
        }
    }

    private static void ValidateTitle(
        string title)
    {
        if (string.IsNullOrWhiteSpace(
                title))
        {
            throw new ArgumentException(
                "Alt görev başlığı boş bırakılamaz.");
        }

        if (title.Length < 3)
        {
            throw new ArgumentException(
                "Alt görev başlığı en az 3 karakter olmalıdır.");
        }

        if (title.Length > 200)
        {
            throw new ArgumentException(
                "Alt görev başlığı en fazla 200 karakter olabilir.");
        }
    }

    private static void ValidateDescription(
        string description)
    {
        if (string.IsNullOrWhiteSpace(
                description))
        {
            throw new ArgumentException(
                "Alt görev açıklaması boş bırakılamaz.");
        }

        if (description.Length < 3)
        {
            throw new ArgumentException(
                "Alt görev açıklaması en az 3 karakter olmalıdır.");
        }

        if (description.Length > 2000)
        {
            throw new ArgumentException(
                "Alt görev açıklaması en fazla 2000 karakter olabilir.");
        }
    }

    private static void ValidateDueDate(
        DateTime? dueDate,
        ProjectTask parentTask)
    {
        if (!dueDate.HasValue)
        {
            return;
        }

        if (parentTask.DueDate.HasValue &&
            dueDate.Value >
            parentTask.DueDate.Value)
        {
            throw new ArgumentException(
                "Alt görev teslim tarihi ana görevin teslim tarihinden sonra olamaz.");
        }
    }

    private static SubtaskDto MapSubtask(
        ProjectTask task)
    {
        return new SubtaskDto
        {
            Id =
                task.Id,

            ParentTaskId =
                task.ParentTaskId!.Value,

            ProjectId =
                task.ProjectId,

            Title =
                task.Title,

            Description =
                task.Description,

            AssignedUserId =
                task.AssignedUserId,

            Status =
                task.Status,

            Priority =
                task.Priority,

            DueDate =
                task.DueDate,

            CreatedAt =
                task.CreatedAt
        };
    }

    private static ChecklistItemDto MapChecklist(
        TaskChecklistItem item)
    {
        return new ChecklistItemDto
        {
            Id =
                item.Id,

            ProjectTaskId =
                item.ProjectTaskId,

            Title =
                item.Title,

            IsCompleted =
                item.IsCompleted,

            SortOrder =
                item.SortOrder,

            CompletedAt =
                item.CompletedAt
        };
    }
}