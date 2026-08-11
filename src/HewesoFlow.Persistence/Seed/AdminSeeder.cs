using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Seed;

public static class AdminSeeder
{
    private const string AdminRoleName = "Admin";
    private const string AdminEmail = "admin@hewesoflow.com";
    private const string AdminPassword = "Admin123!";

    public static async Task SeedAsync(
        AppDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        CancellationToken cancellationToken = default)
    {
        var adminRole = await dbContext.Roles
            .FirstOrDefaultAsync(
                role =>
                    role.Name == AdminRoleName &&
                    role.IsActive,
                cancellationToken);

        if (adminRole is null)
        {
            throw new InvalidOperationException(
                "Admin rolü bulunamadı. RoleSeeder önce çalıştırılmalıdır.");
        }

        var adminUser = await dbContext.Users
            .FirstOrDefaultAsync(
                user => user.Email == AdminEmail,
                cancellationToken);

        if (adminUser is null)
        {
            adminUser = new User
            {
                FirstName = "System",
                LastName = "Admin",
                Email = AdminEmail,
                Department = "Administration",
                IsActive = true
            };

            adminUser.PasswordHash =
                passwordHasher.HashPassword(
                    adminUser,
                    AdminPassword);

            await dbContext.Users.AddAsync(
                adminUser,
                cancellationToken);

            await dbContext.SaveChangesAsync(
                cancellationToken);
        }

        var hasAdminRole = await dbContext.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId == adminUser.Id &&
                    userRole.RoleId == adminRole.Id,
                cancellationToken);

        if (!hasAdminRole)
        {
            var userRole = new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id,
                AssignedAt = DateTime.UtcNow,
                IsActive = true
            };

            await dbContext.UserRoles.AddAsync(
                userRole,
                cancellationToken);

            await dbContext.SaveChangesAsync(
                cancellationToken);
        }
    }
}