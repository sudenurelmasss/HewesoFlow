using HewesoFlow.Application.Features.Comments.DTOs;

namespace HewesoFlow.Application.Abstractions.Comments;

public interface ICommentService
{
    Task<CommentResponseDto> CreateAsync(
        Guid projectTaskId,
        CreateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CommentResponseDto>> GetByTaskIdAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<CommentResponseDto> UpdateAsync(
        Guid commentId,
        UpdateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid commentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}