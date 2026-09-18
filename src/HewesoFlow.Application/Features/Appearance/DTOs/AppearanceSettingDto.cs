namespace HewesoFlow.Application.Features.Appearance.DTOs;

public class AppearanceSettingDto
{
    public string CompanyName { get; set; } = "Heweso";

    public string ProductName { get; set; } = "Flow";

    public string? LogoDataUrl { get; set; }

    public string FullBrandName
    {
        get
        {
            var companyName =
                string.IsNullOrWhiteSpace(CompanyName)
                    ? string.Empty
                    : CompanyName.Trim();

            var productName =
                string.IsNullOrWhiteSpace(ProductName)
                    ? "Flow"
                    : ProductName.Trim();

            if (string.IsNullOrWhiteSpace(companyName))
            {
                return productName;
            }

            return $"{companyName}{productName}";
        }
    }
}