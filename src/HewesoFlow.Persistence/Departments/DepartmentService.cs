using HewesoFlow.Application.Abstractions.Departments;
using HewesoFlow.Application.Features.Departments.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Departments;

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;

    public DepartmentService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DepartmentListDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .AsNoTracking()
            .Where(department =>
                !department.IsDeleted)
            .OrderBy(department => department.Name)
            .Select(department => new DepartmentListDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                ManagerId = department.ManagerId,

                ManagerName =
                    department.Manager == null
                        ? null
                        : department.Manager.FirstName +
                          " " +
                          department.Manager.LastName,

                IsActive = department.IsActive,

                UserCount =
                    department.Users.Count(user =>
                        !user.IsDeleted),

                ProjectCount =
                    department.Projects.Count(project =>
                        !project.IsDeleted)
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DepartmentListDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .AsNoTracking()
            .Where(department =>
                department.Id == id &&
                !department.IsDeleted)
            .Select(department => new DepartmentListDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                ManagerId = department.ManagerId,

                ManagerName =
                    department.Manager == null
                        ? null
                        : department.Manager.FirstName +
                          " " +
                          department.Manager.LastName,

                IsActive = department.IsActive,

                UserCount =
                    department.Users.Count(user =>
                        !user.IsDeleted),

                ProjectCount =
                    department.Projects.Count(project =>
                        !project.IsDeleted)
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<DepartmentListDto> CreateAsync(
        CreateDepartmentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(
                nameof(request));
        }

        var name =
            request.Name?.Trim() ??
            string.Empty;

        ValidateName(name);

        var departmentExists =
            await _context.Departments
                .AnyAsync(
                    department =>
                        department.Name == name &&
                        !department.IsDeleted,
                    cancellationToken);

        if (departmentExists)
        {
            throw new InvalidOperationException(
                "Bu isimde bir departman zaten bulunmaktadır.");
        }

        var department =
            new Department
            {
                Id = Guid.NewGuid(),
                Name = name,

                Description =
                    string.IsNullOrWhiteSpace(
                        request.Description)
                        ? null
                        : request.Description.Trim(),

                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

        await _context.Departments.AddAsync(
            department,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return new DepartmentListDto
        {
            Id = department.Id,
            Name = department.Name,
            Description = department.Description,
            ManagerId = null,
            ManagerName = null,
            IsActive = department.IsActive,
            UserCount = 0,
            ProjectCount = 0
        };
    }

    public async Task<DepartmentListDto?> UpdateAsync(
        UpdateDepartmentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(
                nameof(request));
        }

        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == request.Id &&
                        !item.IsDeleted,
                    cancellationToken);

        if (department is null)
        {
            return null;
        }

        var name =
            request.Name?.Trim() ??
            string.Empty;

        ValidateName(name);

        var duplicateExists =
            await _context.Departments
                .AnyAsync(
                    item =>
                        item.Id != request.Id &&
                        item.Name == name &&
                        !item.IsDeleted,
                    cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                "Bu isimde başka bir departman zaten bulunmaktadır.");
        }

        department.Name = name;

        department.Description =
            string.IsNullOrWhiteSpace(
                request.Description)
                ? null
                : request.Description.Trim();

        department.IsActive =
            request.IsActive;

        department.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return await GetByIdAsync(
            department.Id,
            cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == id &&
                        !item.IsDeleted,
                    cancellationToken);

        if (department is null)
        {
            return false;
        }

        department.IsDeleted = true;
        department.IsActive = false;
        department.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<bool> AssignManagerAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == departmentId &&
                        !item.IsDeleted &&
                        item.IsActive,
                    cancellationToken);

        if (department is null)
        {
            return false;
        }

        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == userId &&
                        !item.IsDeleted &&
                        item.IsActive,
                    cancellationToken);

        if (user is null)
        {
            return false;
        }

        department.ManagerId =
            user.Id;

        department.UpdatedAt =
            DateTime.UtcNow;

        user.DepartmentId =
            department.Id;

        user.Department =
            department.Name;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<bool> AssignUserAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == departmentId &&
                        !item.IsDeleted &&
                        item.IsActive,
                    cancellationToken);

        if (department is null)
        {
            return false;
        }

        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    item =>
                        item.Id == userId &&
                        !item.IsDeleted &&
                        item.IsActive,
                    cancellationToken);

        if (user is null)
        {
            return false;
        }

        user.DepartmentId =
            department.Id;

        // Eski Department string alanımızı
        // geçiş sürecinde senkron tutuyoruz.
        user.Department =
            department.Name;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    private static void ValidateName(
        string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Departman adı boş bırakılamaz.");
        }

        if (name.Length < 2)
        {
            throw new ArgumentException(
                "Departman adı en az 2 karakter olmalıdır.");
        }

        if (name.Length > 150)
        {
            throw new ArgumentException(
                "Departman adı en fazla 150 karakter olabilir.");
        }
    }
}