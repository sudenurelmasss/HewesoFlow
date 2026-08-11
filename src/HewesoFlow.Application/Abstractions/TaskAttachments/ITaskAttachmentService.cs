using HewesoFlow.Application.Features.TaskAttachments.DTOs;

namespace HewesoFlow.Application.Abstractions.TaskAttachments;

public interface ITaskAttachmentService
{
    Task<TaskAttachmentDto> UploadAsync(
        Guid taskId,
        UploadTaskAttachmentRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaskAttachmentDto>> GetAllAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<TaskAttachmentDownloadDto> DownloadAsync(
        Guid taskId,
        Guid attachmentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid taskId,
        Guid attachmentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}