using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Seed;

public static class RoleSeeder
{
    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        await EnsureRoleExistsAsync(
            dbContext,
            "Admin",
            "Sistem genelinde tam yetkili yönetici rolü.",
            cancellationToken);

        await EnsureRoleExistsAsync(
            dbContext,
            "ProjectManager",
            "Proje oluşturabilen, yöneten ve ekip üyelerini yönetebilen proje yöneticisi rolü.",
            cancellationToken);

        await EnsureRoleExistsAsync(
            dbContext,
            "TeamMember",
            "Projelerde görev alan standart ekip üyesi rolü.",
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureRoleExistsAsync(
        AppDbContext dbContext,
        string roleName,
        string description,
        CancellationToken cancellationToken)
    {
        var existingRole = await dbContext.Roles
            .FirstOrDefaultAsync(
                role => role.Name == roleName,
                cancellationToken);

        if (existingRole is not null)
        {
            if (!existingRole.IsActive)
            {
                existingRole.IsActive = true;
            }

            return;
        }

        var role = new Role
        {
            Name = roleName,
            Description = description,
            IsActive = true
        };

        await dbContext.Roles.AddAsync(
            role,
            cancellationToken);
    }
}