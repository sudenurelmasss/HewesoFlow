using System.ComponentModel.DataAnnotations;

namespace HewesoFlow.Application.Features.ProjectMessages.DTOs;

public class CreateProjectMessageRequestDto
{
    /*
     * NULL => proje geneli.
     * GUID => özel mesaj.
     */
    public Guid? RecipientUserId { get; set; }

    [Required]
    [StringLength(
        3000,
        MinimumLength = 1)]
    public string Content { get; set; } =
        string.Empty;
}