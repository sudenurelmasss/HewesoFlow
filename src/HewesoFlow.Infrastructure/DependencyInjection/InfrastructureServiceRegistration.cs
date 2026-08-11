using HewesoFlow.Application.Abstractions.Authentication;
using HewesoFlow.Infrastructure.Authentication.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HewesoFlow.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services)
    {
        services.AddScoped<ITokenService, JwtTokenService>();

        return services;
    }
}