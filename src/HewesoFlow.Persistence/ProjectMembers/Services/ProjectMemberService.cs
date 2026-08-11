using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.ProjectMembers;
using HewesoFlow.Application.Features.ProjectMembers.DTOs;
using HewesoFlow.Domain.Entities;

namespace HewesoFlow.Persistence.ProjectMembers.Services;

public class ProjectMemberService : IProjectMemberService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProjectMemberService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProjectMemberResponseDto> AddMemberAsync(
        AddProjectMemberRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.FirstOrDefaultAsync(
            project =>
                project.Id == request.ProjectId &&
                !project.IsDeleted,
            cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        var isAdmin = await IsAdminAsync(
            currentUserId,
            cancellationToken);

        var isProjectOwner =
            project.OwnerId == currentUserId;

        if (!isAdmin && !isProjectOwner)
        {
            throw new UnauthorizedAccessException(
                "Bu projeye üye ekleme yetkiniz bulunmuyor.");
        }

        var user = await _unitOfWork.Users.FirstOrDefaultAsync(
            user =>
                user.Id == request.UserId &&
                user.IsActive &&
                !user.IsDeleted,
            cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Projeye eklenecek aktif kullanıcı bulunamadı.");
        }

        var existingMember =
            await _unitOfWork.ProjectMembers.FirstOrDefaultAsync(
                member =>
                    member.ProjectId == request.ProjectId &&
                    member.UserId == request.UserId,
                cancellationToken);

        if (existingMember is not null)
        {
            if (existingMember.IsActive &&
                !existingMember.IsDeleted)
            {
                throw new InvalidOperationException(
                    "Bu kullanıcı zaten projeye eklenmiş.");
            }

            existingMember.Role = request.Role;
            existingMember.IsActive = true;
            existingMember.IsDeleted = false;
            existingMember.JoinedAt = DateTime.UtcNow;
            existingMember.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.ProjectMembers.Update(
                existingMember);

            await _unitOfWork.SaveChangesAsync(
                cancellationToken);

            return MapToResponse(
                existingMember,
                user.FirstName,
                user.LastName,
                user.Email);
        }

        var projectMember = new ProjectMember
        {
            ProjectId = request.ProjectId,
            UserId = request.UserId,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProjectMembers.AddAsync(
            projectMember,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return MapToResponse(
            projectMember,
            user.FirstName,
            user.LastName,
            user.Email);
    }

    public async Task<IReadOnlyList<ProjectMemberResponseDto>>
        GetMembersAsync(
            Guid projectId,
            Guid currentUserId,
            CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.FirstOrDefaultAsync(
            project =>
                project.Id == projectId &&
                !project.IsDeleted,
            cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        var isAdmin = await IsAdminAsync(
            currentUserId,
            cancellationToken);

        var isProjectOwner =
            project.OwnerId == currentUserId;

        var isProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == projectId &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!isAdmin &&
            !isProjectOwner &&
            !isProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu projenin üyelerini görüntüleme yetkiniz bulunmuyor.");
        }

        var members =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.ProjectId == projectId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var result =
            new List<ProjectMemberResponseDto>();

        foreach (var member in members
                     .OrderBy(member => member.JoinedAt))
        {
            var user =
                await _unitOfWork.Users.FirstOrDefaultAsync(
                    user =>
                        user.Id == member.UserId &&
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

            if (user is null)
            {
                continue;
            }

            result.Add(
                MapToResponse(
                    member,
                    user.FirstName,
                    user.LastName,
                    user.Email));
        }

        return result;
    }

    private async Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var adminRole =
            await _unitOfWork.Roles.FirstOrDefaultAsync(
                role =>
                    role.Name == "Admin" &&
                    role.IsActive &&
                    !role.IsDeleted,
                cancellationToken);

        if (adminRole is null)
        {
            return false;
        }

        return await _unitOfWork.UserRoles.AnyAsync(
            userRole =>
                userRole.UserId == userId &&
                userRole.RoleId == adminRole.Id &&
                userRole.IsActive &&
                !userRole.IsDeleted,
            cancellationToken);
    }

    private static ProjectMemberResponseDto MapToResponse(
        ProjectMember projectMember,
        string firstName,
        string lastName,
        string email)
    {
        return new ProjectMemberResponseDto
        {
            Id = projectMember.Id,
            ProjectId = projectMember.ProjectId,
            UserId = projectMember.UserId,

            FirstName = firstName,
            LastName = lastName,

            FullName =
                $"{firstName} {lastName}".Trim(),

            Email = email,

            Role = projectMember.Role,
            JoinedAt = projectMember.JoinedAt,
            IsActive = projectMember.IsActive
        };
    }
}