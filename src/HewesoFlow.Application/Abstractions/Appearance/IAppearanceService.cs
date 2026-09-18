using HewesoFlow.Application.Features.Appearance.DTOs;

namespace HewesoFlow.Application.Abstractions.Appearance;

public interface IAppearanceService
{
    Task<AppearanceSettingDto> GetAsync(
        CancellationToken cancellationToken = default);

    Task<AppearanceSettingDto> UpdateAsync(
        UpdateAppearanceSettingRequestDto request,
        CancellationToken cancellationToken = default);
}