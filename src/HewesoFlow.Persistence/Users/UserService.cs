using HewesoFlow.Application.Abstractions.Users;
using HewesoFlow.Application.Features.Users.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Users;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserListDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Department = u.Department,
                IsActive = u.IsActive,

                Roles = u.UserRoles
                    .Where(ur =>
                        ur.IsActive &&
                        !ur.IsDeleted &&
                        ur.Role.IsActive &&
                        !ur.Role.IsDeleted)
                    .Select(ur => ur.Role.Name)
                    .Distinct()
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return users;
    }

    public async Task<UserListDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(u =>
                u.Id == id &&
                !u.IsDeleted)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Department = u.Department,
                IsActive = u.IsActive,

                Roles = u.UserRoles
                    .Where(ur =>
                        ur.IsActive &&
                        !ur.IsDeleted &&
                        ur.Role.IsActive &&
                        !ur.Role.IsDeleted)
                    .Select(ur => ur.Role.Name)
                    .Distinct()
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return user;
    }

    public async Task<bool> ChangeStatusAsync(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(
                u =>
                    u.Id == id &&
                    !u.IsDeleted,
                cancellationToken);

        if (user is null)
        {
            return false;
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<List<RoleListDto>> GetRolesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(r =>
                !r.IsDeleted &&
                r.IsActive)
            .OrderBy(r => r.Name)
            .Select(r => new RoleListDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsActive = r.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AssignRoleAsync(
        Guid userId,
        Guid roleId,
        Guid assignedByUserId,
        CancellationToken cancellationToken = default)
    {
        var userExists = await _context.Users
            .AnyAsync(
                u =>
                    u.Id == userId &&
                    !u.IsDeleted,
                cancellationToken);

        if (!userExists)
        {
            return false;
        }

        var roleExists = await _context.Roles
            .AnyAsync(
                r =>
                    r.Id == roleId &&
                    !r.IsDeleted &&
                    r.IsActive,
                cancellationToken);

        if (!roleExists)
        {
            return false;
        }

        var existingUserRole = await _context.UserRoles
            .FirstOrDefaultAsync(
                ur =>
                    ur.UserId == userId &&
                    ur.RoleId == roleId,
                cancellationToken);

        if (existingUserRole is not null)
        {
            existingUserRole.IsActive = true;
            existingUserRole.IsDeleted = false;
            existingUserRole.AssignedAt = DateTime.UtcNow;
            existingUserRole.AssignedByUserId = assignedByUserId;
            existingUserRole.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        var userRole = new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoleId = roleId,
            AssignedByUserId = assignedByUserId,
            AssignedAt = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.UserRoles.AddAsync(
            userRole,
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> RemoveRoleAsync(
        Guid userId,
        Guid roleId,
        CancellationToken cancellationToken = default)
    {
        var userRole = await _context.UserRoles
            .FirstOrDefaultAsync(
                ur =>
                    ur.UserId == userId &&
                    ur.RoleId == roleId &&
                    !ur.IsDeleted,
                cancellationToken);

        if (userRole is null)
        {
            return false;
        }

        userRole.IsActive = false;
        userRole.IsDeleted = true;
        userRole.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}