namespace HewesoFlow.Application.Features.TaskAttachments.DTOs;

public class TaskAttachmentDto
{
    public Guid Id { get; set; }

    public Guid ProjectTaskId { get; set; }

    public Guid UploadedByUserId { get; set; }

    public string UploadedByUserName { get; set; } = string.Empty;

    public string OriginalFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public DateTime CreatedAt { get; set; }
}