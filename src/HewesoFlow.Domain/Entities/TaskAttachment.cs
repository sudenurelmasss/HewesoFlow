namespace HewesoFlow.Domain.Entities;

public class TaskAttachment : BaseEntity
{
    public Guid ProjectTaskId { get; set; }

    public Guid UploadedByUserId { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public ProjectTask ProjectTask { get; set; } = null!;

    public User UploadedByUser { get; set; } = null!;
}