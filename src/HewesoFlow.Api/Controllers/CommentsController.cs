using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Comments;
using HewesoFlow.Application.Features.Comments.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(
        ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpPost("api/tasks/{taskId:guid}/comments")]
    public async Task<IActionResult> Create(
        Guid taskId,
        [FromBody] CreateCommentRequestDto request,
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
            var comment =
                await _commentService.CreateAsync(
                    taskId,
                    request,
                    currentUserId,
                    cancellationToken);

            return Created(
                $"/api/comments/{comment.Id}",
                comment);
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

    [HttpGet("api/tasks/{taskId:guid}/comments")]
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
            var comments =
                await _commentService.GetByTaskIdAsync(
                    taskId,
                    currentUserId,
                    cancellationToken);

            return Ok(comments);
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

    [HttpPut("api/comments/{commentId:guid}")]
    public async Task<IActionResult> Update(
        Guid commentId,
        [FromBody] UpdateCommentRequestDto request,
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
            var comment =
                await _commentService.UpdateAsync(
                    commentId,
                    request,
                    currentUserId,
                    cancellationToken);

            return Ok(comment);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
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

    [HttpDelete("api/comments/{commentId:guid}")]
    public async Task<IActionResult> Delete(
        Guid commentId,
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
            await _commentService.DeleteAsync(
                commentId,
                currentUserId,
                cancellationToken);

            return NoContent();
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