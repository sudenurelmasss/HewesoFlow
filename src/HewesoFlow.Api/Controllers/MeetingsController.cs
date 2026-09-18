using System.Security.Claims;

using HewesoFlow.Application.Abstractions.Meetings;
using HewesoFlow.Application.Features.Meetings;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _service;

    public MeetingsController(
        IMeetingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var userId))
        {
            return Unauthorized();
        }

        var meetings =
            await _service.GetAllAsync(
                userId,
                cancellationToken);

        return Ok(
            meetings);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var userId))
        {
            return Unauthorized();
        }

        var meeting =
            await _service.GetByIdAsync(
                id,
                userId,
                cancellationToken);

        if (meeting is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Toplantı bulunamadı."
                });
        }

        return Ok(
            meeting);
    }

    [HttpPost]
    [Authorize(
        Roles =
            "Admin,ProjectManager")]
    public async Task<IActionResult> Create(
        [FromBody]
        CreateMeetingRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var meeting =
                await _service.CreateAsync(
                    request,
                    userId,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id =
                        meeting.Id
                },
                meeting);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                new
                {
                    message =
                        exception.Message
                });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message =
                        exception.Message
                });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        exception.Message
                });
        }
    }

    private bool TryGetCurrentUserId(
        out Guid userId)
    {
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)
            ??
            User.FindFirstValue(
                "sub");

        return Guid.TryParse(
            value,
            out userId);
    }
}