using HewesoFlow.Domain.Entities;

namespace HewesoFlow.Application.Abstractions.Persistence;

public interface IUnitOfWork
{
    IGenericRepository<User> Users { get; }

    IGenericRepository<Role> Roles { get; }

    IGenericRepository<UserRole> UserRoles { get; }

    IGenericRepository<Project> Projects { get; }

    IGenericRepository<ProjectMember> ProjectMembers { get; }

    IGenericRepository<ProjectTask> ProjectTasks { get; }

    IGenericRepository<Comment> Comments { get; }

    IGenericRepository<TaskHistory> TaskHistories { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}