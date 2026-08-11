namespace HewesoFlow.Application.Features.Comments.DTOs;

public class CommentResponseDto
{
    public Guid Id { get; set; }

    public string Content { get; set; } = string.Empty;

    public Guid ProjectTaskId { get; set; }

    public string ProjectTaskTitle { get; set; } = string.Empty;

    public Guid UserId { get; set; }

    public string UserFullName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}