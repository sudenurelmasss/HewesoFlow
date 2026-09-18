using System.ComponentModel.DataAnnotations;

namespace HewesoFlow.Application.Features.Projects.DTOs;

public class CreateProjectRequestDto
{
    [Required]
    [StringLength(
        150,
        MinimumLength = 3)]
    public string Name { get; set; } =
        string.Empty;

    [Required]
    [StringLength(
        2000,
        MinimumLength = 3)]
    public string Description { get; set; } =
        string.Empty;

    [Required]
    public Guid DepartmentId { get; set; }

    /*
     * Admin proje oluştururken zorunlu.
     *
     * ProjectManager kendi projesini oluşturuyorsa
     * backend kendisini otomatik kullanabilir.
     */
    public Guid? ProjectManagerId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool RequiresMemberApproval { get; set; }
}