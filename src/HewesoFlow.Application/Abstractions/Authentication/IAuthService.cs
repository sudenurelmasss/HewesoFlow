using HewesoFlow.Application.Features.Authentication.DTOs;

namespace HewesoFlow.Application.Abstractions.Authentication;

public interface IAuthService
{
    Task<AuthServiceResultDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default);

    Task<AuthServiceResultDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default);
}