using System.Security.Claims;
using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TaskAdvancedController : ControllerBase
{
    private readonly ITaskAdvancedService _service;

    public TaskAdvancedController(
        ITaskAdvancedService service)
    {
        _service = service;
    }

    [HttpPost("{taskId:guid}/subtasks")]
    public async Task<IActionResult> CreateSubtask(
        Guid taskId,
        [FromBody] CreateSubtaskRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var result =
                await _service.CreateSubtaskAsync(
                    taskId,
                    request,
                    userId,
                    cancellationToken);

            return Ok(result);
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpGet("{taskId:guid}/subtasks")]
    public async Task<IActionResult> GetSubtasks(
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
                await _service.GetSubtasksAsync(
                    taskId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpPost("{taskId:guid}/checklist")]
    public async Task<IActionResult> CreateChecklist(
        Guid taskId,
        [FromBody] CreateChecklistItemRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.CreateChecklistItemAsync(
                    taskId,
                    request,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpGet("{taskId:guid}/checklist")]
    public async Task<IActionResult> GetChecklist(
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
                await _service.GetChecklistAsync(
                    taskId,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpPatch(
        "{taskId:guid}/checklist/{itemId:guid}")]
    public async Task<IActionResult> UpdateChecklist(
        Guid taskId,
        Guid itemId,
        [FromBody] UpdateChecklistItemRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.UpdateChecklistItemAsync(
                    taskId,
                    itemId,
                    request,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpDelete(
        "{taskId:guid}/checklist/{itemId:guid}")]
    public async Task<IActionResult> DeleteChecklist(
        Guid taskId,
        Guid itemId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.DeleteChecklistItemAsync(
                taskId,
                itemId,
                userId,
                cancellationToken);

            return NoContent();
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpPost("{taskId:guid}/tags")]
    public async Task<IActionResult> AddTag(
        Guid taskId,
        [FromBody] CreateTaskTagRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.AddTagAsync(
                    taskId,
                    request,
                    userId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(exception);
        }
    }

    [HttpGet("{taskId:guid}/tags")]
    public async Task<IActionResult> GetTags(
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
                await _service.GetTagsAsync(
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
        "{taskId:guid}/tags/{tagId:guid}")]
    public async Task<IActionResult> RemoveTag(
        Guid taskId,
        Guid tagId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.RemoveTagAsync(
                taskId,
                tagId,
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