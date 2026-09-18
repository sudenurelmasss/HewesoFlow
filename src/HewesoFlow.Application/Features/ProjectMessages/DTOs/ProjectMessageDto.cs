namespace HewesoFlow.Application.Features.ProjectMessages.DTOs;

public class ProjectMessageDto
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public Guid SenderUserId { get; set; }

    public string SenderName { get; set; } =
        string.Empty;

    public Guid? RecipientUserId { get; set; }

    public string? RecipientName { get; set; }

    public bool IsPrivate =>
        RecipientUserId.HasValue;

    public string Content { get; set; } =
        string.Empty;

    public DateTime CreatedAt { get; set; }
}