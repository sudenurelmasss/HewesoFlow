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
            .OrderBy(department =>
                department.Name)
            .Select(department =>
                new DepartmentListDto
                {
                    Id = department.Id,

                    Name = department.Name,

                    /*
                     * Departman açıklaması artık
                     * uygulama mantığında kullanılmıyor.
                     */
                    Description = null,

                    /*
                     * Departmana tek ProjectManager
                     * bağlama mantığı kaldırıldı.
                     *
                     * ProjectManager bilgileri artık
                     * UserRoles üzerinden bulunuyor.
                     */
                    ManagerId = null,
                    ManagerName = null,

                    /*
                     * Veritabanında alanı şimdilik
                     * koruyoruz fakat tüm normal
                     * departmanlar aktif kabul ediliyor.
                     */
                    IsActive = true,

                    /*
                     * Kullanıcı sayısı yalnızca gerçekten
                     * aktif olan kullanıcıları sayar.
                     */
                    UserCount =
                        department.Users.Count(user =>
                            user.IsActive &&
                            !user.IsDeleted),

                    ProjectCount = 0
                })
            .ToListAsync(
                cancellationToken);
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
            .Select(department =>
                new DepartmentListDto
                {
                    Id = department.Id,

                    Name = department.Name,

                    Description = null,

                    ManagerId = null,
                    ManagerName = null,

                    IsActive = true,

                    UserCount =
                        department.Users.Count(user =>
                            user.IsActive &&
                            !user.IsDeleted),

                    ProjectCount = 0
                })
            .FirstOrDefaultAsync(
                cancellationToken);
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

        var normalizedName =
            name.ToLowerInvariant();

        var departmentExists =
            await _context.Departments
                .AnyAsync(
                    department =>
                        department.Name.ToLower() ==
                            normalizedName &&
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

                /*
                 * Artık departman oluştururken
                 * açıklama kullanılmıyor.
                 */
                Description = null,

                /*
                 * Departman oluşturulduğu anda
                 * kullanılabilir durumda olur.
                 */
                IsActive = true,

                /*
                 * ManagerId özellikle boş bırakılıyor.
                 *
                 * Çünkü bir departmanda birden fazla
                 * ProjectManager bulunabilir.
                 */
                ManagerId = null,

                IsDeleted = false,

                CreatedAt =
                    DateTime.UtcNow
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

            Description = null,

            ManagerId = null,
            ManagerName = null,

            IsActive = true,

            UserCount = 0,

            ProjectCount = 0
        };
    }

    /*
     * Eski endpoint sistemde bulunmaya devam ettiği
     * için UpdateAsync metodunu kaldırmıyoruz.
     *
     * Fakat artık yalnızca departman adı değiştiriliyor.
     * Açıklama ve aktif/pasif kullanılmıyor.
     */
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

        var normalizedName =
            name.ToLowerInvariant();

        var duplicateExists =
            await _context.Departments
                .AnyAsync(
                    item =>
                        item.Id != request.Id &&
                        item.Name.ToLower() ==
                            normalizedName &&
                        !item.IsDeleted,
                    cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                "Bu isimde başka bir departman zaten bulunmaktadır.");
        }

        department.Name = name;

        department.Description = null;

        department.IsActive = true;

        department.UpdatedAt =
            DateTime.UtcNow;

        /*
         * Departman adı değişirse o departmandaki
         * kullanıcıların eski string Department
         * alanını da senkron tutuyoruz.
         */
        var users =
            await _context.Users
                .Where(user =>
                    user.DepartmentId ==
                        department.Id &&
                    !user.IsDeleted)
                .ToListAsync(
                    cancellationToken);

        foreach (var user in users)
        {
            user.Department =
                department.Name;

            user.UpdatedAt =
                DateTime.UtcNow;
        }

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

        /*
         * Kullanıcısı bulunan departmanın
         * yanlışlıkla silinmesini engelliyoruz.
         */
        var hasUsers =
            await _context.Users
                .AnyAsync(
                    user =>
                        user.DepartmentId == id &&
                        !user.IsDeleted,
                    cancellationToken);

        if (hasUsers)
        {
            throw new InvalidOperationException(
                "İçerisinde kullanıcı bulunan departman silinemez.");
        }

        var hasProjects =
            await _context.Projects
                .AnyAsync(
                    project =>
                        project.DepartmentId == id &&
                        !project.IsDeleted,
                    cancellationToken);

        if (hasProjects)
        {
            throw new InvalidOperationException(
                "İçerisinde proje bulunan departman silinemez.");
        }

        department.IsDeleted = true;

        department.IsActive = false;

        department.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    /*
     * Bu metot eski API uyumluluğu için tutuluyor.
     *
     * Artık departmana "tek manager" atamıyoruz.
     *
     * ProjectManager ataması Admin ekranındaki
     * UserRole mekanizmasıyla yapılmalı.
     */
    public Task<bool> AssignManagerAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException(
            "Departmana tek bir yönetici atanmaz. Kullanıcıya Admin ekranından ProjectManager rolü verin.");
    }

    /*
     * Kullanıcının departmanı gerekiyorsa Admin
     * tarafından değiştirilebilmesi için bu eski
     * metodu koruyoruz.
     */
    public async Task<bool> AssignUserAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var department =
            await _context.Departments
                .FirstOrDefaultAsync(
                    item =>
                        item.Id ==
                            departmentId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (department is null)
        {
            return false;
        }

        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    item =>
                        item.Id ==
                            userId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (user is null)
        {
            return false;
        }

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

    private static void ValidateName(
        string name)
    {
        if (string.IsNullOrWhiteSpace(
                name))
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