using HewesoFlow.Domain.Entities;

namespace HewesoFlow.Application.Abstractions.Authentication;

public interface ITokenService
{
    string CreateToken(
        User user,
        IReadOnlyCollection<string> roles,
        out DateTime expiration);
}