namespace HewesoFlow.Application.Features.Comments.DTOs;

public class CommentResponseDto
{
    public Guid Id { get; set; }

    public string Content { get; set; } =
        string.Empty;

    /*
     * Yorumun ait olduğu görev.
     */
    public Guid ProjectTaskId { get; set; }

    public string ProjectTaskTitle { get; set; } =
        string.Empty;

    /*
     * Yorumu yazan kullanıcı.
     */
    public Guid UserId { get; set; }

    public string UserFullName { get; set; } =
        string.Empty;

    /*
     * NULL ise genel görev yorumu.
     *
     * Doluysa kişiye özel yorum:
     * yalnızca gönderen ve alıcı görür.
     */
    public Guid? RecipientUserId { get; set; }

    public string? RecipientUserFullName { get; set; }

    public bool IsPrivate =>
        RecipientUserId.HasValue;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}