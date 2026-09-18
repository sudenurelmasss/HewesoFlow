namespace HewesoFlow.Application.Features.Appearance.DTOs;

public class UpdateAppearanceSettingRequestDto
{
    public string CompanyName { get; set; } = string.Empty;

    public string? LogoDataUrl { get; set; }
}