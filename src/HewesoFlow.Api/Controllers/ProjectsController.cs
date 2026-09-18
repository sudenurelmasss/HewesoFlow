using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Projects;
using HewesoFlow.Application.Features.Projects.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectController(
        IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Create(
        [FromBody] CreateProjectRequestDto request,
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
            var project =
                await _projectService.CreateAsync(
                    request,
                    currentUserId,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = project.Id
                },
                project);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
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
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
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

        var projects =
            await _projectService.GetAllAsync(
                currentUserId,
                cancellationToken);

        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
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
            var project =
                await _projectService.GetByIdAsync(
                    id,
                    currentUserId,
                    cancellationToken);

            if (project is null)
            {
                return NotFound(new
                {
                    message = "Proje bulunamadı."
                });
            }

            return Ok(project);
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
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProjectRequestDto request,
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

        if (request.Id != Guid.Empty &&
            request.Id != id)
        {
            return BadRequest(new
            {
                message =
                    "Adres içerisindeki proje kimliği ile gönderilen proje kimliği uyuşmuyor."
            });
        }

        request.Id = id;

        try
        {
            var project =
                await _projectService.UpdateAsync(
                    request,
                    currentUserId,
                    cancellationToken);

            if (project is null)
            {
                return NotFound(new
                {
                    message =
                        "Proje bulunamadı."
                });
            }

            return Ok(project);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
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
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> Delete(
        Guid id,
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
            var deleted =
                await _projectService.DeleteAsync(
                    id,
                    currentUserId,
                    cancellationToken);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Proje bulunamadı."
                });
            }

            return Ok(new
            {
                message = "Proje başarıyla silindi."
            });
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
    }

    [HttpPost("{id:guid}/request-completion")]
    [Authorize(Roles = "ProjectManager")]
    public async Task<IActionResult> RequestCompletion(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId)) return Unauthorized();
        try
        {
            var project = await _projectService.RequestCompletionAsync(id, currentUserId, cancellationToken);
            return project is null ? NotFound(new { message = "Proje bulunamadı." }) : Ok(project);
        }
        catch (Exception ex) when (ex is InvalidOperationException or UnauthorizedAccessException)
        {
            return ex is UnauthorizedAccessException
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/approve-completion")]
    [Authorize(Roles = "ProjectManager")]
    public async Task<IActionResult> ApproveCompletion(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId)) return Unauthorized();
        try
        {
            var project = await _projectService.ApproveCompletionAsync(id, currentUserId, cancellationToken);
            return project is null ? NotFound(new { message = "Proje bulunamadı." }) : Ok(project);
        }
        catch (Exception ex) when (ex is InvalidOperationException or UnauthorizedAccessException)
        {
            return ex is UnauthorizedAccessException
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{projectId:guid}/summary")]
    public async Task<IActionResult> GetSummary(
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
            var summary =
                await _projectService.GetSummaryAsync(
                    projectId,
                    currentUserId,
                    cancellationToken);

            if (summary is null)
            {
                return NotFound(new
                {
                    message = "Proje bulunamadı."
                });
            }

            return Ok(summary);
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
    }

    private bool TryGetCurrentUserId(
        out Guid currentUserId)
    {
        currentUserId = Guid.Empty;

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
            out currentUserId);
    }
}