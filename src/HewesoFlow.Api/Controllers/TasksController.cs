using System.Security.Claims;
using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Features.ProjectTasks.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IProjectTaskService _projectTaskService;

    public TasksController(
        IProjectTaskService projectTaskService)
    {
        _projectTaskService = projectTaskService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProjectTaskRequestDto request,
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
            var projectTask =
                await _projectTaskService.CreateAsync(
                    request,
                    currentUserId,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = projectTask.Id
                },
                projectTask);
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
        [FromQuery] ProjectTaskFilterDto filter,
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
            var projectTasks =
                await _projectTaskService.GetAllAsync(
                    filter,
                    currentUserId,
                    cancellationToken);

            return Ok(projectTasks);
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
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
            var projectTask =
                await _projectTaskService.GetByIdAsync(
                    id,
                    currentUserId,
                    cancellationToken);

            return Ok(projectTask);
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProjectTaskRequestDto request,
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
            var projectTask =
                await _projectTaskService.UpdateAsync(
                    id,
                    request,
                    currentUserId,
                    cancellationToken);

            return Ok(projectTask);
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

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateProjectTaskStatusRequestDto request,
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
            var projectTask =
                await _projectTaskService.UpdateStatusAsync(
                    id,
                    request,
                    currentUserId,
                    cancellationToken);

            return Ok(projectTask);
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
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
            await _projectTaskService.DeleteAsync(
                id,
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