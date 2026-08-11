namespace HewesoFlow.Application.Features.TaskAttachments.DTOs;

public class UploadTaskAttachmentRequest
{
    public Stream Content { get; set; } = Stream.Null;

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } =
        "application/octet-stream";

    public long Length { get; set; }
}