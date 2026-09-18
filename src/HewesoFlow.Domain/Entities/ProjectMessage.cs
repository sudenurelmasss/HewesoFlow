namespace HewesoFlow.Domain.Entities;

public class ProjectMessage : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Project Project { get; set; } =
        null!;

    public Guid SenderUserId { get; set; }

    public User SenderUser { get; set; } =
        null!;

    /*
     * NULL ise proje geneline gönderilmiş mesaj.
     *
     * Doluysa özel mesaj.
     */
    public Guid? RecipientUserId { get; set; }

    public User? RecipientUser { get; set; }

    public string Content { get; set; } =
        string.Empty;
}