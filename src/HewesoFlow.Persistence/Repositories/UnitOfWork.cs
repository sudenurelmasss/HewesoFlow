using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;

namespace HewesoFlow.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _dbContext;

    private IGenericRepository<User>? _users;
    private IGenericRepository<Role>? _roles;
    private IGenericRepository<UserRole>? _userRoles;
    private IGenericRepository<Project>? _projects;
    private IGenericRepository<ProjectMember>? _projectMembers;
    private IGenericRepository<ProjectTask>? _projectTasks;
    private IGenericRepository<Comment>? _comments;
    private IGenericRepository<TaskHistory>? _taskHistories;

    public UnitOfWork(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IGenericRepository<User> Users =>
        _users ??=
            new GenericRepository<User>(
                _dbContext);

    public IGenericRepository<Role> Roles =>
        _roles ??=
            new GenericRepository<Role>(
                _dbContext);

    public IGenericRepository<UserRole> UserRoles =>
        _userRoles ??=
            new GenericRepository<UserRole>(
                _dbContext);

    public IGenericRepository<Project> Projects =>
        _projects ??=
            new GenericRepository<Project>(
                _dbContext);

    public IGenericRepository<ProjectMember> ProjectMembers =>
        _projectMembers ??=
            new GenericRepository<ProjectMember>(
                _dbContext);

    public IGenericRepository<ProjectTask> ProjectTasks =>
        _projectTasks ??=
            new GenericRepository<ProjectTask>(
                _dbContext);

    public IGenericRepository<Comment> Comments =>
        _comments ??=
            new GenericRepository<Comment>(
                _dbContext);

    public IGenericRepository<TaskHistory> TaskHistories =>
        _taskHistories ??=
            new GenericRepository<TaskHistory>(
                _dbContext);

    public async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(
            cancellationToken);
    }
}