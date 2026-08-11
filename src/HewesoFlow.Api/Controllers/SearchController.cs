using System.Security.Claims;
using HewesoFlow.Application.Abstractions.Search;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IGlobalSearchService _service;

    public SearchController(
        IGlobalSearchService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string query,
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(
                out var currentUserId))
        {
            return Unauthorized(new
            {
                message =
                    "Token içerisindeki kullanıcı bilgisi geçersiz."
            });
        }

        try
        {
            var result =
                await _service.SearchAsync(
                    query,
                    currentUserId,
                    take,
                    cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
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