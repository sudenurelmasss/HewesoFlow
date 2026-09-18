using HewesoFlow.Application.Abstractions.Authentication;
using HewesoFlow.Application.Features.Authentication.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Authentication.Services;

public class AuthService : IAuthService
{
    private const string DefaultRoleName =
        "TeamMember";

    private readonly AppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        AppDbContext dbContext,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher)
    {
        _dbContext =
            dbContext;

        _tokenService =
            tokenService;

        _passwordHasher =
            passwordHasher;
    }

    public async Task<AuthServiceResultDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var firstName =
            request.FirstName?.Trim() ??
            string.Empty;

        var lastName =
            request.LastName?.Trim() ??
            string.Empty;

        var email =
            request.Email?.Trim()
                .ToLowerInvariant() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                firstName))
        {
            return AuthServiceResultDto.Failure(
                "Ad alanı boş bırakılamaz.");
        }

        if (firstName.Length > 100)
        {
            return AuthServiceResultDto.Failure(
                "Ad en fazla 100 karakter olabilir.");
        }

        if (string.IsNullOrWhiteSpace(
                lastName))
        {
            return AuthServiceResultDto.Failure(
                "Soyad alanı boş bırakılamaz.");
        }

        if (lastName.Length > 100)
        {
            return AuthServiceResultDto.Failure(
                "Soyad en fazla 100 karakter olabilir.");
        }

        if (string.IsNullOrWhiteSpace(
                email))
        {
            return AuthServiceResultDto.Failure(
                "E-posta alanı boş bırakılamaz.");
        }

        if (email.Length > 250)
        {
            return AuthServiceResultDto.Failure(
                "E-posta adresi çok uzun.");
        }

        if (string.IsNullOrWhiteSpace(
                request.Password))
        {
            return AuthServiceResultDto.Failure(
                "Şifre alanı boş bırakılamaz.");
        }

        if (request.Password.Length < 8)
        {
            return AuthServiceResultDto.Failure(
                "Şifre en az 8 karakter olmalıdır.");
        }

        if (request.Password.Length > 128)
        {
            return AuthServiceResultDto.Failure(
                "Şifre en fazla 128 karakter olabilir.");
        }

        var emailExists =
            await _dbContext.Users
                .AnyAsync(
                    user =>
                        user.Email == email &&
                        !user.IsDeleted,
                    cancellationToken);

        if (emailExists)
        {
            return AuthServiceResultDto.Failure(
                "Bu e-posta adresiyle daha önce kayıt oluşturulmuş.");
        }

        if (!request.DepartmentId.HasValue)
        {
            return AuthServiceResultDto.Failure(
                "Kayıt olmak için bir departman seçmelisiniz.");
        }

        var selectedDepartment =
            await _dbContext.Departments
                .FirstOrDefaultAsync(
                    department =>
                        department.Id == request.DepartmentId.Value &&
                        department.IsActive &&
                        !department.IsDeleted,
                    cancellationToken);

        if (selectedDepartment is null)
        {
            return AuthServiceResultDto.Failure(
                "Seçilen departman bulunamadı veya aktif değil.");
        }

        var user =
            new User
            {
                FirstName =
                    firstName,

                LastName =
                    lastName,

                Email =
                    email,

                Department = selectedDepartment.Name,
                DepartmentId = selectedDepartment.Id,

                IsActive =
                    true,

                IsDeleted =
                    false,

                CreatedAt =
                    DateTime.UtcNow
            };

        user.PasswordHash =
            _passwordHasher.HashPassword(
                user,
                request.Password);

        var defaultRole =
            await _dbContext.Roles
                .FirstOrDefaultAsync(
                    role =>
                        role.Name ==
                            DefaultRoleName &&
                        role.IsActive &&
                        !role.IsDeleted,
                    cancellationToken);

        if (defaultRole is null)
        {
            defaultRole =
                new Role
                {
                    Name =
                        DefaultRoleName,

                    Description =
                        "Standart ekip üyesi rolü",

                    IsActive =
                        true,

                    IsDeleted =
                        false,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _dbContext.Roles.AddAsync(
                defaultRole,
                cancellationToken);
        }

        var userRole =
            new UserRole
            {
                UserId =
                    user.Id,

                RoleId =
                    defaultRole.Id,

                AssignedAt =
                    DateTime.UtcNow,

                IsActive =
                    true,

                IsDeleted =
                    false,

                User =
                    user,

                Role =
                    defaultRole,

                CreatedAt =
                    DateTime.UtcNow
            };

        await _dbContext.Users.AddAsync(
            user,
            cancellationToken);

        await _dbContext.UserRoles.AddAsync(
            userRole,
            cancellationToken);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var roles =
            new List<string>
            {
                defaultRole.Name
            };

        var token =
            _tokenService.CreateToken(
                user,
                roles,
                out var tokenExpiration);

        var response =
            new AuthResponseDto
            {
                UserId =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Email =
                    user.Email,

                Token =
                    token,

                TokenExpiration =
                    tokenExpiration,

                Roles =
                    roles
            };

        return AuthServiceResultDto.Success(
            "Kullanıcı kaydı başarıyla oluşturuldu.",
            response);
    }

    public async Task<AuthServiceResultDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email =
            request.Email?.Trim()
                .ToLowerInvariant() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                email) ||
            string.IsNullOrWhiteSpace(
                request.Password))
        {
            return AuthServiceResultDto.Failure(
                "E-posta ve şifre alanları zorunludur.");
        }

        var user =
            await _dbContext.Users
                .Include(user =>
                    user.UserRoles)
                .ThenInclude(userRole =>
                    userRole.Role)
                .FirstOrDefaultAsync(
                    user =>
                        user.Email == email &&
                        !user.IsDeleted,
                    cancellationToken);

        if (user is null)
        {
            return AuthServiceResultDto.Failure(
                "E-posta adresi veya şifre hatalı.");
        }

        if (!user.IsActive)
        {
            return AuthServiceResultDto.Failure(
                "Bu kullanıcı hesabı aktif değildir.");
        }

        var passwordResult =
            _passwordHasher
                .VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password);

        if (passwordResult ==
            PasswordVerificationResult.Failed)
        {
            return AuthServiceResultDto.Failure(
                "E-posta adresi veya şifre hatalı.");
        }

        if (passwordResult ==
            PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password);

            user.UpdatedAt =
                DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }

        var roles =
            user.UserRoles
                .Where(userRole =>
                    userRole.IsActive &&
                    !userRole.IsDeleted &&
                    userRole.Role.IsActive &&
                    !userRole.Role.IsDeleted)
                .Select(userRole =>
                    userRole.Role.Name)
                .Distinct()
                .ToList();

        if (roles.Count == 0)
        {
            return AuthServiceResultDto.Failure(
                "Kullanıcının aktif bir sistem rolü bulunmamaktadır.");
        }

        var token =
            _tokenService.CreateToken(
                user,
                roles,
                out var tokenExpiration);

        var response =
            new AuthResponseDto
            {
                UserId =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Email =
                    user.Email,

                Token =
                    token,

                TokenExpiration =
                    tokenExpiration,

                Roles =
                    roles
            };

        return AuthServiceResultDto.Success(
            "Giriş işlemi başarılı.",
            response);
    }
}