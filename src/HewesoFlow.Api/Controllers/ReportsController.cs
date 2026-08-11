using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(
        IReportService service)
    {
        _service = service;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        return Ok(
            await _service.GetSummaryAsync(
                currentUserId,
                cancellationToken));
    }

    [HttpGet("workload")]
    public async Task<IActionResult> GetWorkload(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        return Ok(
            await _service.GetWorkloadAsync(
                currentUserId,
                cancellationToken));
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized();
        }

        return Ok(
            await _service.GetProjectsAsync(
                currentUserId,
                cancellationToken));
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