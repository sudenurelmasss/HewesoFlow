namespace HewesoFlow.Application.Features.Comments.DTOs;

public class CreateCommentRequestDto
{
    public string Content { get; set; } =
        string.Empty;

    /*
     * Doluysa yalnızca bu kişi + gönderen görür.
     */
    public Guid? RecipientUserId { get; set; }
}