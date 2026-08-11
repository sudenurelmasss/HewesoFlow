using HewesoFlow.Application.Abstractions.Dependencies;
using HewesoFlow.Application.Features.Dependencies.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Dependencies;

public class DependencyService : IDependencyService
{
    private readonly AppDbContext _context;

    public DependencyService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<DependencyDto> AddTaskDependencyAsync(
        Guid taskId,
        Guid dependsOnTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (taskId == dependsOnTaskId)
        {
            throw new ArgumentException(
                "Bir görev kendisine bağımlı olamaz.");
        }

        var task =
            await GetManageableTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        var dependencyTask =
            await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == dependsOnTaskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (dependencyTask is null)
        {
            throw new KeyNotFoundException(
                "Bağımlı olunacak görev bulunamadı.");
        }

        if (task.ProjectId !=
            dependencyTask.ProjectId)
        {
            throw new InvalidOperationException(
                "Görev bağımlılıkları aynı proje içerisindeki görevler arasında kurulmalıdır.");
        }

        var exists =
            await _context.ProjectTaskDependencies
                .AnyAsync(
                    x =>
                        x.ProjectTaskId == taskId &&
                        x.DependsOnTaskId == dependsOnTaskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Bu görev bağımlılığı zaten mevcut.");
        }

        var reverseExists =
            await _context.ProjectTaskDependencies
                .AnyAsync(
                    x =>
                        x.ProjectTaskId == dependsOnTaskId &&
                        x.DependsOnTaskId == taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (reverseExists)
        {
            throw new InvalidOperationException(
                "Bu işlem doğrudan döngüsel bağımlılık oluşturur.");
        }

        var dependency =
            new ProjectTaskDependency
            {
                Id = Guid.NewGuid(),
                ProjectTaskId = taskId,
                DependsOnTaskId = dependsOnTaskId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

        await _context.ProjectTaskDependencies.AddAsync(
            dependency,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return new DependencyDto
        {
            Id = dependency.Id,
            SourceId = taskId,
            DependsOnId = dependsOnTaskId,
            DependsOnName = dependencyTask.Title,
            CreatedAt = dependency.CreatedAt
        };
    }

    public async Task<IReadOnlyList<DependencyDto>> GetTaskDependenciesAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        return await _context.ProjectTaskDependencies
            .AsNoTracking()
            .Where(x =>
                x.ProjectTaskId == taskId &&
                !x.IsDeleted &&
                !x.DependsOnTask.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new DependencyDto
            {
                Id = x.Id,
                SourceId = x.ProjectTaskId,
                DependsOnId = x.DependsOnTaskId,
                DependsOnName = x.DependsOnTask.Title,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task RemoveTaskDependencyAsync(
        Guid taskId,
        Guid dependencyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetManageableTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var dependency =
            await _context.ProjectTaskDependencies
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == dependencyId &&
                        x.ProjectTaskId == taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (dependency is null)
        {
            throw new KeyNotFoundException(
                "Görev bağımlılığı bulunamadı.");
        }

        dependency.IsDeleted = true;
        dependency.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task<DependencyDto> AddProjectDependencyAsync(
        Guid projectId,
        Guid dependsOnProjectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (projectId == dependsOnProjectId)
        {
            throw new ArgumentException(
                "Bir proje kendisine bağımlı olamaz.");
        }

        await GetManageableProjectAsync(
            projectId,
            currentUserId,
            cancellationToken);

        var targetProject =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == dependsOnProjectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (targetProject is null)
        {
            throw new KeyNotFoundException(
                "Bağımlı olunacak proje bulunamadı.");
        }

        var exists =
            await _context.ProjectDependencies
                .AnyAsync(
                    x =>
                        x.ProjectId == projectId &&
                        x.DependsOnProjectId ==
                            dependsOnProjectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Bu proje bağımlılığı zaten mevcut.");
        }

        var reverseExists =
            await _context.ProjectDependencies
                .AnyAsync(
                    x =>
                        x.ProjectId ==
                            dependsOnProjectId &&
                        x.DependsOnProjectId ==
                            projectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (reverseExists)
        {
            throw new InvalidOperationException(
                "Bu işlem doğrudan döngüsel proje bağımlılığı oluşturur.");
        }

        var dependency =
            new ProjectDependency
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                DependsOnProjectId =
                    dependsOnProjectId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

        await _context.ProjectDependencies.AddAsync(
            dependency,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return new DependencyDto
        {
            Id = dependency.Id,
            SourceId = projectId,
            DependsOnId =
                dependsOnProjectId,
            DependsOnName =
                targetProject.Name,
            CreatedAt =
                dependency.CreatedAt
        };
    }

    public async Task<IReadOnlyList<DependencyDto>> GetProjectDependenciesAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleProjectAsync(
            projectId,
            currentUserId,
            cancellationToken);

        return await _context.ProjectDependencies
            .AsNoTracking()
            .Where(x =>
                x.ProjectId == projectId &&
                !x.IsDeleted &&
                !x.DependsOnProject.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new DependencyDto
            {
                Id = x.Id,
                SourceId = x.ProjectId,
                DependsOnId =
                    x.DependsOnProjectId,
                DependsOnName =
                    x.DependsOnProject.Name,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task RemoveProjectDependencyAsync(
        Guid projectId,
        Guid dependencyId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetManageableProjectAsync(
            projectId,
            currentUserId,
            cancellationToken);

        var dependency =
            await _context.ProjectDependencies
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == dependencyId &&
                        x.ProjectId == projectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (dependency is null)
        {
            throw new KeyNotFoundException(
                "Proje bağımlılığı bulunamadı.");
        }

        dependency.IsDeleted = true;
        dependency.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    private async Task<ProjectTask> GetAccessibleTaskAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var task =
            await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (task is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        await GetAccessibleProjectAsync(
            task.ProjectId,
            currentUserId,
            cancellationToken);

        return task;
    }

    private async Task<ProjectTask> GetManageableTaskAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var task =
            await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (task is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        await GetManageableProjectAsync(
            task.ProjectId,
            currentUserId,
            cancellationToken);

        return task;
    }

    private async Task<Project> GetAccessibleProjectAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == projectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return project;
        }

        if (project.OwnerId ==
            currentUserId)
        {
            return project;
        }

        var member =
            await _context.ProjectMembers
                .AnyAsync(
                    x =>
                        x.ProjectId == projectId &&
                        x.UserId == currentUserId &&
                        x.IsActive &&
                        !x.IsDeleted,
                    cancellationToken);

        if (!member)
        {
            throw new UnauthorizedAccessException(
                "Bu projeye erişim yetkiniz bulunmamaktadır.");
        }

        return project;
    }

    private async Task<Project> GetManageableProjectAsync(
        Guid projectId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == projectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return project;
        }

        if (project.OwnerId !=
            currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Bu projede bağımlılık yönetme yetkiniz bulunmamaktadır.");
        }

        return project;
    }

    private async Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.UserId == userId &&
                    x.IsActive &&
                    !x.IsDeleted &&
                    x.Role.IsActive &&
                    !x.Role.IsDeleted &&
                    x.Role.Name == "Admin",
                cancellationToken);
    }
}