namespace HewesoFlow.Domain.Entities;

public class AppearanceSetting : BaseEntity
{
    public string CompanyName { get; set; } = "Heweso";

    public string ProductName { get; set; } = "Flow";

    public string? LogoDataUrl { get; set; }
}