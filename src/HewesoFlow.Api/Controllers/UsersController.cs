using System.Security.Claims;

using HewesoFlow.Application.Abstractions.Users;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(
        IUserService userService)
    {
        _userService =
            userService;
    }

    /* =========================================================
       USERS
       ========================================================= */

    [HttpGet]
    [Authorize(
        Roles =
            "Admin,ProjectManager")]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var users =
            await _userService
                .GetAllAsync(
                    cancellationToken);

        return Ok(
            users);
    }

    [HttpGet("{id:guid}")]
    [Authorize(
        Roles =
            "Admin,ProjectManager")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var user =
            await _userService
                .GetByIdAsync(
                    id,
                    cancellationToken);

        if (user is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Kullanıcı bulunamadı."
                });
        }

        return Ok(
            user);
    }

    /* =========================================================
       ROLES
       ========================================================= */

    [HttpGet("roles")]
    [Authorize(
        Roles = "Admin")]
    public async Task<IActionResult> GetRoles(
        CancellationToken cancellationToken)
    {
        var roles =
            await _userService
                .GetRolesAsync(
                    cancellationToken);

        return Ok(
            roles);
    }

    /* =========================================================
       STATUS
       ========================================================= */

    [HttpPatch("{id:guid}/status")]
    [Authorize(
        Roles = "Admin")]
    public async Task<IActionResult> ChangeStatus(
        Guid id,
        [FromQuery]
        bool isActive,
        CancellationToken cancellationToken)
    {
        if (
            !TryGetCurrentUserId(
                out var currentAdminId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisindeki kullanıcı bilgisi geçersiz."
                });
        }

        /*
         * Sistem Admini kendi hesabını
         * pasif hale getiremez.
         */
        if (
            id == currentAdminId &&
            !isActive)
        {
            return BadRequest(
                new
                {
                    message =
                        "Kendi admin hesabınızı pasif hale getiremezsiniz."
                });
        }

        var result =
            await _userService
                .ChangeStatusAsync(
                    id,
                    isActive,
                    cancellationToken);

        if (!result)
        {
            return NotFound(
                new
                {
                    message =
                        "Kullanıcı bulunamadı."
                });
        }

        return Ok(
            new
            {
                message =
                    isActive
                        ? "Kullanıcı aktif hale getirildi."
                        : "Kullanıcı pasif hale getirildi."
            });
    }

    /* =========================================================
       ASSIGN ROLE
       ========================================================= */

    [HttpPost(
        "{userId:guid}/roles/{roleId:guid}")]
    [Authorize(
        Roles = "Admin")]
    public async Task<IActionResult> AssignRole(
        Guid userId,
        Guid roleId,
        CancellationToken cancellationToken)
    {
        if (
            !TryGetCurrentUserId(
                out var adminUserId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisindeki kullanıcı bilgisi geçersiz."
                });
        }

        try
        {
            var result =
                await _userService
                    .AssignRoleAsync(
                        userId,
                        roleId,
                        adminUserId,
                        cancellationToken);

            if (!result)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Kullanıcı veya rol bulunamadı."
                    });
            }

            return Ok(
                new
                {
                    message =
                        "Rol kullanıcıya başarıyla atandı."
                });
        }
        catch (
            InvalidOperationException
            exception)
        {
            return BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
    }

    /* =========================================================
       REMOVE ROLE
       ========================================================= */

    [HttpDelete(
        "{userId:guid}/roles/{roleId:guid}")]
    [Authorize(
        Roles = "Admin")]
    public async Task<IActionResult> RemoveRole(
        Guid userId,
        Guid roleId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _userService
                    .RemoveRoleAsync(
                        userId,
                        roleId,
                        cancellationToken);

            if (!result)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Kullanıcının bu rolü bulunamadı."
                    });
            }

            return Ok(
                new
                {
                    message =
                        "Rol kullanıcıdan kaldırıldı."
                });
        }
        catch (
            InvalidOperationException
            exception)
        {
            return BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
    }

    /* =========================================================
       TOKEN
       ========================================================= */

    private bool TryGetCurrentUserId(
        out Guid userId)
    {
        userId =
            Guid.Empty;

        var idValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (
            string.IsNullOrWhiteSpace(
                idValue))
        {
            idValue =
                User.FindFirstValue(
                    "sub");
        }

        return Guid.TryParse(
            idValue,
            out userId);
    }
}