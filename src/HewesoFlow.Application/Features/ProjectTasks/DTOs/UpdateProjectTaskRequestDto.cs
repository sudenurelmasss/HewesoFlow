using System.ComponentModel.DataAnnotations;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class UpdateProjectTaskRequestDto
{
    [Required(ErrorMessage = "Görev başlığı zorunludur.")]
    [StringLength(
        200,
        MinimumLength = 3,
        ErrorMessage = "Görev başlığı 3 ile 200 karakter arasında olmalıdır.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Görev açıklaması zorunludur.")]
    [StringLength(
        2000,
        MinimumLength = 3,
        ErrorMessage = "Görev açıklaması 3 ile 2000 karakter arasında olmalıdır.")]
    public string Description { get; set; } = string.Empty;

    public Guid? AssignedUserId { get; set; }

    public TaskPriority Priority { get; set; }

    public DateTime? DueDate { get; set; }
}