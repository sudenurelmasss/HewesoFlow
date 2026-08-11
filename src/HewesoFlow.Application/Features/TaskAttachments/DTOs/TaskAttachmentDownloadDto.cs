namespace HewesoFlow.Application.Features.TaskAttachments.DTOs;

public class TaskAttachmentDownloadDto
{
    public byte[] Content { get; set; } = [];

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } =
        "application/octet-stream";
}