namespace HewesoFlow.Domain.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } =
        string.Empty;

    public Guid ProjectTaskId { get; set; }

    public Guid UserId { get; set; }

    /*
     * NULL ise yorum genel görev yorumu.
     *
     * Doluysa yorum kişiye özeldir.
     * Yalnızca gönderen ve alıcı görür.
     */
    public Guid? RecipientUserId { get; set; }

    public ProjectTask ProjectTask { get; set; } =
        null!;

    public User User { get; set; } =
        null!;

    public User? RecipientUser { get; set; }
}