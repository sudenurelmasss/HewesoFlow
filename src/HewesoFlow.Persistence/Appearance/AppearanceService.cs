using HewesoFlow.Application.Abstractions.Appearance;
using HewesoFlow.Application.Features.Appearance.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Appearance;

public class AppearanceService : IAppearanceService
{
    private const string ProductName = "Flow";

    private readonly AppDbContext _dbContext;

    public AppearanceService(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AppearanceSettingDto> GetAsync(
        CancellationToken cancellationToken = default)
    {
        AppearanceSetting setting =
            await GetOrCreateAsync(
                cancellationToken);

        return Map(setting);
    }

    public async Task<AppearanceSettingDto> UpdateAsync(
        UpdateAppearanceSettingRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ArgumentException(
                "Görünüm bilgileri gönderilmedi.");
        }

        var companyName =
            request.CompanyName?.Trim()
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(
            companyName))
        {
            throw new ArgumentException(
                "Şirket adı boş bırakılamaz.");
        }

        if (companyName.Length > 80)
        {
            throw new ArgumentException(
                "Şirket adı en fazla 80 karakter olabilir.");
        }

        var logoDataUrl =
            NormalizeLogo(
                request.LogoDataUrl);

        AppearanceSetting setting =
            await GetOrCreateAsync(
                cancellationToken);

        setting.CompanyName =
            companyName;

        setting.ProductName =
            ProductName;

        setting.LogoDataUrl =
            logoDataUrl;

        setting.UpdatedAt =
            DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return Map(setting);
    }

    private async Task<AppearanceSetting> GetOrCreateAsync(
        CancellationToken cancellationToken)
    {
        DbSet<AppearanceSetting> settings =
            _dbContext.Set<AppearanceSetting>();

        AppearanceSetting? setting =
            await settings
                .FirstOrDefaultAsync(
                    x => !x.IsDeleted,
                    cancellationToken);

        if (setting != null)
        {
            return setting;
        }

        setting =
            new AppearanceSetting
            {
                CompanyName =
                    "Heweso",

                ProductName =
                    ProductName,

                LogoDataUrl =
                    null
            };

        settings.Add(setting);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return setting;
    }

    private static string? NormalizeLogo(
        string? logoDataUrl)
    {
        if (string.IsNullOrWhiteSpace(
            logoDataUrl))
        {
            return null;
        }

        var value =
            logoDataUrl.Trim();

        var valid =
            value.StartsWith(
                "data:image/png;base64,",
                StringComparison.OrdinalIgnoreCase)
            ||
            value.StartsWith(
                "data:image/jpeg;base64,",
                StringComparison.OrdinalIgnoreCase)
            ||
            value.StartsWith(
                "data:image/jpg;base64,",
                StringComparison.OrdinalIgnoreCase)
            ||
            value.StartsWith(
                "data:image/webp;base64,",
                StringComparison.OrdinalIgnoreCase);

        if (!valid)
        {
            throw new ArgumentException(
                "Logo PNG, JPG veya WEBP formatında olmalıdır.");
        }

        const int maximumLength =
            3_000_000;

        if (value.Length >
            maximumLength)
        {
            throw new ArgumentException(
                "Logo dosyası en fazla 2 MB olabilir.");
        }

        return value;
    }

    private static AppearanceSettingDto Map(
        AppearanceSetting setting)
    {
        return new AppearanceSettingDto
        {
            CompanyName =
                string.IsNullOrWhiteSpace(
                    setting.CompanyName)
                    ? "Heweso"
                    : setting.CompanyName.Trim(),

            ProductName =
                ProductName,

            LogoDataUrl =
                setting.LogoDataUrl
        };
    }
}