using HewesoFlow.Application.Features.Users.DTOs;

namespace HewesoFlow.Application.Abstractions.Users;

public interface IUserService
{
    Task<List<UserListDto>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<UserListDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> ChangeStatusAsync(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken = default);

    Task<List<RoleListDto>> GetRolesAsync(
        CancellationToken cancellationToken = default);

    Task<bool> AssignRoleAsync(
        Guid userId,
        Guid roleId,
        Guid assignedByUserId,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveRoleAsync(
        Guid userId,
        Guid roleId,
        CancellationToken cancellationToken = default);
}