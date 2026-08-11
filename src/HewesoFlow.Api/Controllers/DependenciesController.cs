using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Dependencies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class DependenciesController : ControllerBase
{
    private readonly IDependencyService _service;

    public DependenciesController(
        IDependencyService service)
    {
        _service = service;
    }

    [HttpPost(
        "tasks/{taskId:guid}/dependencies/{dependsOnTaskId:guid}")]
    public async Task<IActionResult> AddTaskDependency(
        Guid taskId,
        Guid dependsOnTaskId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.AddTaskDependencyAsync(
                    taskId,
                    dependsOnTaskId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpGet(
        "tasks/{taskId:guid}/dependencies")]
    public async Task<IActionResult> GetTaskDependencies(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.GetTaskDependenciesAsync(
                    taskId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpDelete(
        "tasks/{taskId:guid}/dependencies/{dependencyId:guid}")]
    public async Task<IActionResult> RemoveTaskDependency(
        Guid taskId,
        Guid dependencyId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.RemoveTaskDependencyAsync(
                taskId,
                dependencyId,
                userId,
                cancellationToken);

            return NoContent();
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpPost(
        "projects/{projectId:guid}/dependencies/{dependsOnProjectId:guid}")]
    public async Task<IActionResult> AddProjectDependency(
        Guid projectId,
        Guid dependsOnProjectId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.AddProjectDependencyAsync(
                    projectId,
                    dependsOnProjectId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpGet(
        "projects/{projectId:guid}/dependencies")]
    public async Task<IActionResult> GetProjectDependencies(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.GetProjectDependenciesAsync(
                    projectId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpDelete(
        "projects/{projectId:guid}/dependencies/{dependencyId:guid}")]
    public async Task<IActionResult> RemoveProjectDependency(
        Guid projectId,
        Guid dependencyId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.RemoveProjectDependencyAsync(
                projectId,
                dependencyId,
                userId,
                cancellationToken);

            return NoContent();
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    private IActionResult HandleException(
        Exception exception)
    {
        return exception switch
        {
            ArgumentException =>
                BadRequest(new
                {
                    message = exception.Message
                }),

            InvalidOperationException =>
                BadRequest(new
                {
                    message = exception.Message
                }),

            KeyNotFoundException =>
                NotFound(new
                {
                    message = exception.Message
                }),

            UnauthorizedAccessException =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message = exception.Message
                    }),

            _ =>
                StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Beklenmeyen bir hata oluştu."
                    })
        };
    }

    private bool TryGetCurrentUserId(
        out Guid userId)
    {
        userId = Guid.Empty;

        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(value))
        {
            value =
                User.FindFirstValue("sub");
        }

        return Guid.TryParse(
            value,
            out userId);
    }
}