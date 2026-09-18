using HewesoFlow.Application.Abstractions.Appearance;
using HewesoFlow.Application.Features.Appearance.DTOs;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppearanceController : ControllerBase
{
    private readonly IAppearanceService _appearanceService;

    public AppearanceController(
        IAppearanceService appearanceService)
    {
        _appearanceService = appearanceService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<AppearanceSettingDto>> Get(
        CancellationToken cancellationToken)
    {
        AppearanceSettingDto result =
            await _appearanceService.GetAsync(
                cancellationToken);

        return Ok(result);
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AppearanceSettingDto>> Update(
        [FromBody] UpdateAppearanceSettingRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(
                new
                {
                    message =
                        "Görünüm bilgileri gönderilmedi."
                });
        }

        try
        {
            AppearanceSettingDto result =
                await _appearanceService.UpdateAsync(
                    request,
                    cancellationToken);

            return Ok(result);
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
    }
}