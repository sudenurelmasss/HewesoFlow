using System.Security.Claims;
using HewesoFlow.Application.Abstractions.TaskHistories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Authorize]
public class TaskHistoriesController : ControllerBase
{
    private readonly ITaskHistoryService _taskHistoryService;

    public TaskHistoriesController(
        ITaskHistoryService taskHistoryService)
    {
        _taskHistoryService = taskHistoryService;
    }

    [HttpGet("api/tasks/{taskId:guid}/history")]
    public async Task<IActionResult> GetByTaskId(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        try
        {
            var histories =
                await _taskHistoryService.GetByTaskIdAsync(
                    taskId,
                    currentUserId,
                    cancellationToken);

            return Ok(histories);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
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

    [HttpGet("api/task-histories/recent")]
    public async Task<IActionResult> GetRecent(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        var histories =
            await _taskHistoryService.GetRecentAsync(
                currentUserId,
                count,
                cancellationToken);

        return Ok(histories);
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