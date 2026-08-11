using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HewesoFlow.Application.Abstractions.Authentication;
using HewesoFlow.Application.Common.Settings;
using HewesoFlow.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HewesoFlow.Infrastructure.Authentication.Services;

public class JwtTokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;

    public JwtTokenService(
        IOptions<JwtSettings> jwtSettings)
    {
        _jwtSettings =
            jwtSettings.Value;
    }

    public string CreateToken(
        User user,
        IReadOnlyCollection<string> roles,
        out DateTime expiration)
    {
        if (user.IsDeleted ||
            !user.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif veya silinmiş kullanıcı için token üretilemez.");
        }

        expiration =
            DateTime.UtcNow.AddMinutes(
                _jwtSettings.ExpirationMinutes);

        var claims =
            new List<Claim>
            {
                new(
                    JwtRegisteredClaimNames.Sub,
                    user.Id.ToString()),

                new(
                    JwtRegisteredClaimNames.Email,
                    user.Email),

                new(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString()),

                new(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()),

                new(
                    ClaimTypes.Name,
                    $"{user.FirstName} {user.LastName}"
                        .Trim()),

                new(
                    ClaimTypes.Email,
                    user.Email)
            };

        foreach (var role in roles
                     .Where(role =>
                         !string.IsNullOrWhiteSpace(
                             role))
                     .Distinct(
                         StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(
                new Claim(
                    ClaimTypes.Role,
                    role));
        }

        var secretKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _jwtSettings.SecretKey));

        var signingCredentials =
            new SigningCredentials(
                secretKey,
                SecurityAlgorithms.HmacSha256);

        var token =
            new JwtSecurityToken(
                issuer:
                    _jwtSettings.Issuer,

                audience:
                    _jwtSettings.Audience,

                claims:
                    claims,

                notBefore:
                    DateTime.UtcNow,

                expires:
                    expiration,

                signingCredentials:
                    signingCredentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(
                token);
    }
}