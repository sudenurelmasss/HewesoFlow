using HewesoFlow.Application.Features.Departments.DTOs;

namespace HewesoFlow.Application.Abstractions.Departments;

public interface IDepartmentService
{
    Task<IReadOnlyList<DepartmentListDto>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<DepartmentListDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<DepartmentListDto> CreateAsync(
        CreateDepartmentRequestDto request,
        CancellationToken cancellationToken = default);

    Task<DepartmentListDto?> UpdateAsync(
        UpdateDepartmentRequestDto request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> AssignManagerAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> AssignUserAsync(
        Guid departmentId,
        Guid userId,
        CancellationToken cancellationToken = default);
}