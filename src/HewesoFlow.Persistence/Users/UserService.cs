using HewesoFlow.Application.Abstractions.Users;
using HewesoFlow.Application.Features.Users.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Users;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(
        AppDbContext context)
    {
        _context = context;
    }

    /* =========================================================
       GET ALL
       ========================================================= */

    public async Task<List<UserListDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(user =>
                !user.IsDeleted)
            .OrderBy(user =>
                user.FirstName)
            .ThenBy(user =>
                user.LastName)
            .Select(user =>
                new UserListDto
                {
                    Id =
                        user.Id,

                    FirstName =
                        user.FirstName,

                    LastName =
                        user.LastName,

                    Email =
                        user.Email,

                    DepartmentId =
                        user.DepartmentId,

                    Department =
                        user.DepartmentEntity != null
                            ? user.DepartmentEntity.Name
                            : user.Department,

                    IsActive =
                        user.IsActive,

                    Roles =
                        user.UserRoles
                            .Where(userRole =>
                                userRole.IsActive &&
                                !userRole.IsDeleted &&
                                userRole.Role.IsActive &&
                                !userRole.Role.IsDeleted)
                            .Select(userRole =>
                                userRole.Role.Name)
                            .Distinct()
                            .ToList()
                })
            .ToListAsync(
                cancellationToken);
    }

    /* =========================================================
       GET BY ID
       ========================================================= */

    public async Task<UserListDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == id &&
                !user.IsDeleted)
            .Select(user =>
                new UserListDto
                {
                    Id =
                        user.Id,

                    FirstName =
                        user.FirstName,

                    LastName =
                        user.LastName,

                    Email =
                        user.Email,

                    DepartmentId =
                        user.DepartmentId,

                    Department =
                        user.DepartmentEntity != null
                            ? user.DepartmentEntity.Name
                            : user.Department,

                    IsActive =
                        user.IsActive,

                    Roles =
                        user.UserRoles
                            .Where(userRole =>
                                userRole.IsActive &&
                                !userRole.IsDeleted &&
                                userRole.Role.IsActive &&
                                !userRole.Role.IsDeleted)
                            .Select(userRole =>
                                userRole.Role.Name)
                            .Distinct()
                            .ToList()
                })
            .FirstOrDefaultAsync(
                cancellationToken);
    }

    /* =========================================================
       CHANGE STATUS
       ========================================================= */

    public async Task<bool> ChangeStatusAsync(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Id == id &&
                        !user.IsDeleted,
                    cancellationToken);

        if (user is null)
        {
            return false;
        }

        user.IsActive =
            isActive;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    /* =========================================================
       GET ROLES
       ========================================================= */

    public async Task<List<RoleListDto>> GetRolesAsync(
        CancellationToken cancellationToken = default)
    {
        /*
         * Admin rolü yönetim panelindeki
         * atanabilir roller listesine
         * gönderilmez.
         */
        return await _context.Roles
            .AsNoTracking()
            .Where(role =>
                !role.IsDeleted &&
                role.IsActive &&
                role.Name != "Admin")
            .OrderBy(role =>
                role.Name)
            .Select(role =>
                new RoleListDto
                {
                    Id =
                        role.Id,

                    Name =
                        role.Name,

                    Description =
                        role.Description,

                    IsActive =
                        role.IsActive
                })
            .ToListAsync(
                cancellationToken);
    }

    /* =========================================================
       ASSIGN ROLE
       ========================================================= */

    public async Task<bool> AssignRoleAsync(
        Guid userId,
        Guid roleId,
        Guid assignedByUserId,
        CancellationToken cancellationToken = default)
    {
        var userExists =
            await _context.Users
                .AnyAsync(
                    user =>
                        user.Id == userId &&
                        !user.IsDeleted,
                    cancellationToken);

        if (!userExists)
        {
            return false;
        }

        var role =
            await _context.Roles
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == roleId &&
                        !item.IsDeleted &&
                        item.IsActive,
                    cancellationToken);

        if (role is null)
        {
            return false;
        }

        /*
         * Kritik kural:
         *
         * Admin yeni bir Admin
         * atayamaz.
         */
        if (
            role.Name.Equals(
                "Admin",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Admin rolü başka bir kullanıcıya atanamaz.");
        }

        var existingUserRole =
            await _context.UserRoles
                .FirstOrDefaultAsync(
                    userRole =>
                        userRole.UserId == userId &&
                        userRole.RoleId == roleId,
                    cancellationToken);

        if (existingUserRole is not null)
        {
            existingUserRole.IsActive =
                true;

            existingUserRole.IsDeleted =
                false;

            existingUserRole.AssignedAt =
                DateTime.UtcNow;

            existingUserRole.AssignedByUserId =
                assignedByUserId;

            existingUserRole.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync(
                cancellationToken);

            return true;
        }

        var userRole =
            new UserRole
            {
                Id =
                    Guid.NewGuid(),

                UserId =
                    userId,

                RoleId =
                    roleId,

                AssignedByUserId =
                    assignedByUserId,

                AssignedAt =
                    DateTime.UtcNow,

                IsActive =
                    true,

                IsDeleted =
                    false,

                CreatedAt =
                    DateTime.UtcNow
            };

        await _context.UserRoles
            .AddAsync(
                userRole,
                cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    /* =========================================================
       REMOVE ROLE
       ========================================================= */

    public async Task<bool> RemoveRoleAsync(
        Guid userId,
        Guid roleId,
        CancellationToken cancellationToken = default)
    {
        var role =
            await _context.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == roleId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (role is null)
        {
            return false;
        }

        /*
         * Sistem Admininin Admin
         * rolü de kaldırılamaz.
         */
        if (
            role.Name.Equals(
                "Admin",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Sistem Admini rolü kaldırılamaz.");
        }

        var userRole =
            await _context.UserRoles
                .FirstOrDefaultAsync(
                    item =>
                        item.UserId == userId &&
                        item.RoleId == roleId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (userRole is null)
        {
            return false;
        }

        userRole.IsActive =
            false;

        userRole.IsDeleted =
            true;

        userRole.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}