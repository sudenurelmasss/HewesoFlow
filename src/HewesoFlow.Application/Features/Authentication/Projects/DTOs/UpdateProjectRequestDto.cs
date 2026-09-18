using System.ComponentModel.DataAnnotations;

namespace HewesoFlow.Application.Features.Projects.DTOs;

public class UpdateProjectRequestDto
{
    public Guid Id { get; set; }

    [Required(ErrorMessage = "Proje adı zorunludur.")]
    [StringLength(
        150,
        MinimumLength = 3,
        ErrorMessage = "Proje adı 3 ile 150 karakter arasında olmalıdır.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje açıklaması zorunludur.")]
    [StringLength(
        2000,
        MinimumLength = 3,
        ErrorMessage = "Proje açıklaması 3 ile 2000 karakter arasında olmalıdır.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje departmanı seçilmelidir.")]
    public Guid DepartmentId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool RequiresMemberApproval { get; set; }
}