using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(
        INotificationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        var notifications =
            await _service.GetAllAsync(
                currentUserId,
                cancellationToken);

        return Ok(notifications);
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        var notifications =
            await _service.GetUnreadAsync(
                currentUserId,
                cancellationToken);

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        var count =
            await _service.GetUnreadCountAsync(
                currentUserId,
                cancellationToken);

        return Ok(new
        {
            unreadCount = count
        });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            await _service.MarkAsReadAsync(
                id,
                currentUserId,
                cancellationToken);

            return Ok(new
            {
                message =
                    "Bildirim okundu olarak işaretlendi."
            });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message =
                    exception.Message
            });
        }
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        await _service.MarkAllAsReadAsync(
            currentUserId,
            cancellationToken);

        return Ok(new
        {
            message =
                "Tüm bildirimler okundu olarak işaretlendi."
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
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
                id,
                currentUserId,
                cancellationToken);

            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message =
                    exception.Message
            });
        }
    }

    private bool TryGetCurrentUserId(
        out Guid currentUserId)
    {
        currentUserId =
            Guid.Empty;

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
            out currentUserId);
    }
}