using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(
        IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        var summary =
            await _dashboardService.GetSummaryAsync(
                currentUserId,
                cancellationToken);

        return Ok(summary);
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