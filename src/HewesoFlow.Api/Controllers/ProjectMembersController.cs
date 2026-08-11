using System.Security.Claims;
using HewesoFlow.Application.Abstractions.ProjectMembers;
using HewesoFlow.Application.Features.ProjectMembers.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectMembersController : ControllerBase
{
    private readonly IProjectMemberService _projectMemberService;

    public ProjectMembersController(
        IProjectMemberService projectMemberService)
    {
        _projectMemberService = projectMemberService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> AddMember(
        [FromBody] AddProjectMemberRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new
            {
                message =
                    "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        try
        {
            var projectMember =
                await _projectMemberService.AddMemberAsync(
                    request,
                    currentUserId,
                    cancellationToken);

            return Ok(projectMember);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetMembers(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new
            {
                message =
                    "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        try
        {
            var members =
                await _projectMemberService.GetMembersAsync(
                    projectId,
                    currentUserId,
                    cancellationToken);

            return Ok(members);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    private bool TryGetCurrentUserId(
        out Guid userId)
    {
        userId = Guid.Empty;

        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdValue))
        {
            userIdValue =
                User.FindFirstValue("sub");
        }

        return Guid.TryParse(
            userIdValue,
            out userId);
    }
}