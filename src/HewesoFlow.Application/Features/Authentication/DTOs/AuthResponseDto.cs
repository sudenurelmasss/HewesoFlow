namespace HewesoFlow.Application.Features.Authentication.DTOs;

public class AuthResponseDto
{
    public Guid UserId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime TokenExpiration { get; set; }

    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}