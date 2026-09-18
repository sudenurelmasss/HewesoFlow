using System.Security.Claims;
using HewesoFlow.Application.Abstractions.TaskAttachments;
using HewesoFlow.Application.Abstractions.Comments;
using HewesoFlow.Application.Features.Comments.DTOs;
using HewesoFlow.Application.Features.TaskAttachments.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/tasks/{taskId:guid}/attachments")]
[Authorize]
public class TaskAttachmentsController : ControllerBase
{
    private readonly ITaskAttachmentService _service;
    private readonly ICommentService _commentService;

    public TaskAttachmentsController(
        ITaskAttachmentService service,
        ICommentService commentService)
    {
        _service = service;
        _commentService = commentService;
    }

    [HttpPost]
    [RequestSizeLimit(
        10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        Guid taskId,
        IFormFile file,
        [FromForm] string description,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        if (file is null)
        {
            return BadRequest(new
            {
                message =
                    "Dosya seçilmedi."
            });
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            return BadRequest(new
            {
                message =
                    "Dosya açıklaması zorunludur."
            });
        }

        if (description.Trim().Length > 500)
        {
            return BadRequest(new
            {
                message =
                    "Dosya açıklaması en fazla 500 karakter olabilir."
            });
        }

        try
        {
            await using var stream =
                file.OpenReadStream();

            var request =
                new UploadTaskAttachmentRequest
                {
                    Content =
                        stream,

                    FileName =
                        file.FileName,

                    ContentType =
                        file.ContentType,

                    Length =
                        file.Length
                };

            var result =
                await _service.UploadAsync(
                    taskId,
                    request,
                    currentUserId,
                    cancellationToken);

            await _commentService.CreateAsync(
                taskId,
                new CreateCommentRequestDto
                {
                    Content =
                        $"[DOSYA:{result.OriginalFileName}] {description.Trim()}"
                },
                currentUserId,
                cancellationToken);

            return Ok(result);
        }
        catch (Exception exception)
        {
            return HandleException(
                exception);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            return Ok(
                await _service.GetAllAsync(
                    taskId,
                    currentUserId,
                    cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleException(
                exception);
        }
    }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> Download(
        Guid taskId,
        Guid attachmentId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            var result =
                await _service.DownloadAsync(
                    taskId,
                    attachmentId,
                    currentUserId,
                    cancellationToken);

            return File(
                result.Content,
                result.ContentType,
                result.FileName);
        }
        catch (Exception exception)
        {
            return HandleException(
                exception);
        }
    }

    [HttpDelete("{attachmentId:guid}")]
    public async Task<IActionResult> Delete(
        Guid taskId,
        Guid attachmentId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.DeleteAsync(
                taskId,
                attachmentId,
                currentUserId,
                cancellationToken);

            return NoContent();
        }
        catch (Exception exception)
        {
            return HandleException(
                exception);
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
                    message =
                        exception.Message
                }),

            KeyNotFoundException =>
                NotFound(new
                {
                    message =
                        exception.Message
                }),

            FileNotFoundException =>
                NotFound(new
                {
                    message =
                        exception.Message
                }),

            UnauthorizedAccessException =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            exception.Message
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
        out Guid currentUserId)
    {
        currentUserId =
            Guid.Empty;

        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(
                value))
        {
            value =
                User.FindFirstValue(
                    "sub");
        }

        return Guid.TryParse(
            value,
            out currentUserId);
    }
}