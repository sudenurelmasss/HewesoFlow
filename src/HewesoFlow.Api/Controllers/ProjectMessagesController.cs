using System.Security.Claims;
using HewesoFlow.Application.Abstractions.ProjectMessages;
using HewesoFlow.Application.Features.ProjectMessages.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}/messages")]
public class ProjectMessagesController :
    ControllerBase
{
    private readonly IProjectMessageService _service;

    public ProjectMessagesController(
        IProjectMessageService service)
    {
        _service =
            service;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        Guid projectId,
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
                await _service.GetAsync(
                    projectId,
                    currentUserId,
                    cancellationToken));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                403,
                new
                {
                    message =
                        ex.Message
                });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        Guid projectId,
        CreateProjectMessageRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
            out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            var message =
                await _service.CreateAsync(
                    projectId,
                    request,
                    currentUserId,
                    cancellationToken);

            return Ok(
                message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                403,
                new
                {
                    message =
                        ex.Message
                });
        }
    }

    private bool TryGetCurrentUserId(
        out Guid userId)
    {
        userId =
            Guid.Empty;

        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(
                "sub");

        return Guid.TryParse(
            value,
            out userId);
    }
}