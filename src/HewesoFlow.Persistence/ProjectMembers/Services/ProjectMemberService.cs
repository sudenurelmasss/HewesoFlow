using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.ProjectMembers;
using HewesoFlow.Application.Features.ProjectMembers.DTOs;

using HewesoFlow.Domain.Entities;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.ProjectMembers.Services;

public class ProjectMemberService :
    IProjectMemberService
{
    private readonly IUnitOfWork
        _unitOfWork;

    public ProjectMemberService(
        IUnitOfWork unitOfWork)
    {
        _unitOfWork =
            unitOfWork;
    }

    /* =========================================================
       ADD MEMBER
       ========================================================= */

    public async Task<ProjectMemberResponseDto>
        AddMemberAsync(
            AddProjectMemberRequestDto request,
            Guid currentUserId,
            CancellationToken cancellationToken =
                default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(
                nameof(request));
        }

        /* =====================================================
           PROJECT
           ===================================================== */

        var project =
            await _unitOfWork.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            request.ProjectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        /*
         * Yeni sistemde DepartmentId zorunlu Guid.
         * Guid.Empty olması geçersiz kabul edilir.
         */
        if (project.DepartmentId ==
            Guid.Empty)
        {
            throw new InvalidOperationException(
                "Bu projeye departman atanmamış.");
        }

        /* =====================================================
           AUTHORIZATION
           ===================================================== */

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var isProjectManager =
            await IsProjectManagerAsync(
                currentUserId,
                cancellationToken);

        /*
         * Admin:
         * her projeye üye ekleyebilir.
         *
         * ProjectManager:
         * yalnızca sorumlusu olduğu projeye üye ekleyebilir.
         */

        var isAssignedProjectManager =
            project.ProjectManagerId ==
                currentUserId;

        if (!isAdmin &&
            (!isProjectManager ||
             !isAssignedProjectManager))
        {
            throw new UnauthorizedAccessException(
                "Bu projeye kullanıcı ekleme yetkiniz bulunmuyor.");
        }

        /* =====================================================
           USER
           ===================================================== */

        var user =
            await _unitOfWork.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Id ==
                            request.UserId &&
                        user.IsActive &&
                        !user.IsDeleted,
                    cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Projeye eklenecek aktif kullanıcı bulunamadı.");
        }

        /*
         * Kullanıcı mutlaka departmana bağlı olmalı.
         */
        if (!user.DepartmentId.HasValue)
        {
            throw new InvalidOperationException(
                "Seçilen kullanıcının departmanı bulunmuyor.");
        }

        /* =====================================================
           SAME DEPARTMENT RULE
           ===================================================== */

        /*
         * Projeye yalnızca projenin departmanındaki
         * kullanıcılar eklenebilir.
         */

        if (user.DepartmentId.Value !=
            project.DepartmentId)
        {
            throw new InvalidOperationException(
                "Bu kullanıcı farklı bir departmanda olduğu için projeye eklenemez.");
        }

        /* =====================================================
           PROJECT MANAGER PROTECTION
           ===================================================== */

        /*
         * Projenin atanmış ProjectManager'ı zaten proje
         * oluşturulurken otomatik ekleniyor.
         *
         * Onu tekrar eklemeye çalışma.
         */

        if (request.UserId ==
            project.ProjectManagerId)
        {
            var existingManager =
                await _unitOfWork.ProjectMembers
                    .FirstOrDefaultAsync(
                        member =>
                            member.ProjectId ==
                                project.Id &&
                            member.UserId ==
                                project.ProjectManagerId,
                        cancellationToken);

            if (existingManager is not null &&
                existingManager.IsActive &&
                !existingManager.IsDeleted)
            {
                throw new InvalidOperationException(
                    "ProjectManager zaten projeye atanmış.");
            }
        }

        /* =====================================================
           EXISTING MEMBER
           ===================================================== */

        var existingMember =
            await _unitOfWork.ProjectMembers
                .FirstOrDefaultAsync(
                    member =>
                        member.ProjectId ==
                            request.ProjectId &&
                        member.UserId ==
                            request.UserId,
                    cancellationToken);

        if (existingMember is not null)
        {
            if (existingMember.IsActive &&
                !existingMember.IsDeleted)
            {
                throw new InvalidOperationException(
                    "Bu kullanıcı zaten projeye eklenmiş.");
            }

            /*
             * Eğer eklenen kişi projenin ProjectManager'ıysa
             * rol her zaman Manager olmak zorunda.
             */

            existingMember.Role =
                request.UserId ==
                    project.ProjectManagerId
                    ? ProjectMemberRole.Manager
                    : request.Role;

            existingMember.IsActive =
                true;

            existingMember.IsDeleted =
                false;

            existingMember.JoinedAt =
                DateTime.UtcNow;

            existingMember.UpdatedAt =
                DateTime.UtcNow;

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

        /* =====================================================
           NEW MEMBER
           ===================================================== */

        var projectMember =
            new ProjectMember
            {
                Id =
                    Guid.NewGuid(),

                ProjectId =
                    request.ProjectId,

                UserId =
                    request.UserId,

                Role =
                    request.UserId ==
                        project.ProjectManagerId
                        ? ProjectMemberRole.Manager
                        : request.Role,

                JoinedAt =
                    DateTime.UtcNow,

                IsActive =
                    true,

                IsDeleted =
                    false,

                CreatedAt =
                    DateTime.UtcNow
            };

        await _unitOfWork.ProjectMembers
            .AddAsync(
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

    /* =========================================================
       GET MEMBERS
       ========================================================= */

    public async Task<
        IReadOnlyList<ProjectMemberResponseDto>>
        GetMembersAsync(
            Guid projectId,
            Guid currentUserId,
            CancellationToken cancellationToken =
                default)
    {
        /* =====================================================
           PROJECT
           ===================================================== */

        var project =
            await _unitOfWork.Projects
                .FirstOrDefaultAsync(
                    project =>
                        project.Id ==
                            projectId &&
                        !project.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new InvalidOperationException(
                "Proje bulunamadı.");
        }

        /* =====================================================
           AUTHORIZATION
           ===================================================== */

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var isProjectManager =
            project.ProjectManagerId ==
                currentUserId;

        var isProjectOwner =
            project.OwnerId ==
                currentUserId;

        var isProjectMember =
            await _unitOfWork.ProjectMembers
                .AnyAsync(
                    member =>
                        member.ProjectId ==
                            projectId &&
                        member.UserId ==
                            currentUserId &&
                        member.IsActive &&
                        !member.IsDeleted,
                    cancellationToken);

        if (!isAdmin &&
            !isProjectManager &&
            !isProjectOwner &&
            !isProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu projenin üyelerini görüntüleme yetkiniz bulunmuyor.");
        }

        /* =====================================================
           MEMBERS
           ===================================================== */

        var members =
            await _unitOfWork.ProjectMembers
                .FindAsync(
                    member =>
                        member.ProjectId ==
                            projectId &&
                        member.IsActive &&
                        !member.IsDeleted,
                    cancellationToken);

        var result =
            new List<ProjectMemberResponseDto>();

        foreach (
            var member in
            members
                .OrderBy(
                    member =>
                        member.Role ==
                            ProjectMemberRole.Manager
                            ? 0
                            : 1)
                .ThenBy(
                    member =>
                        member.JoinedAt))
        {
            var user =
                await _unitOfWork.Users
                    .FirstOrDefaultAsync(
                        user =>
                            user.Id ==
                                member.UserId &&
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

    /* =========================================================
       ROLE HELPERS
       ========================================================= */

    private async Task<bool>
        IsAdminAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        var adminRole =
            await _unitOfWork.Roles
                .FirstOrDefaultAsync(
                    role =>
                        role.Name ==
                            "Admin" &&
                        role.IsActive &&
                        !role.IsDeleted,
                    cancellationToken);

        if (adminRole is null)
        {
            return false;
        }

        return await _unitOfWork.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId ==
                        userId &&
                    userRole.RoleId ==
                        adminRole.Id &&
                    userRole.IsActive &&
                    !userRole.IsDeleted,
                cancellationToken);
    }

    private async Task<bool>
        IsProjectManagerAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        var managerRole =
            await _unitOfWork.Roles
                .FirstOrDefaultAsync(
                    role =>
                        role.Name ==
                            "ProjectManager" &&
                        role.IsActive &&
                        !role.IsDeleted,
                    cancellationToken);

        if (managerRole is null)
        {
            return false;
        }

        return await _unitOfWork.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId ==
                        userId &&
                    userRole.RoleId ==
                        managerRole.Id &&
                    userRole.IsActive &&
                    !userRole.IsDeleted,
                cancellationToken);
    }

    /* =========================================================
       MAPPING
       ========================================================= */

    private static ProjectMemberResponseDto
        MapToResponse(
            ProjectMember projectMember,
            string firstName,
            string lastName,
            string email)
    {
        return new ProjectMemberResponseDto
        {
            Id =
                projectMember.Id,

            ProjectId =
                projectMember.ProjectId,

            UserId =
                projectMember.UserId,

            FirstName =
                firstName,

            LastName =
                lastName,

            FullName =
                $"{firstName} {lastName}"
                    .Trim(),

            Email =
                email,

            Role =
                projectMember.Role,

            JoinedAt =
                projectMember.JoinedAt,

            IsActive =
                projectMember.IsActive
        };
    }
}