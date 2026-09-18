using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } =
        string.Empty;

    public string Description { get; set; } =
        string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public ProjectStatus Status { get; set; } =
        ProjectStatus.Planning;

    /*
     * Eski alan adını migration karmaşası çıkarmamak için
     * koruyoruz.
     *
     * Bundan sonra anlamı:
     * "Proje tamamlanırken ProjectManager onayı gerekli mi?"
     */
    public bool RequiresMemberApproval { get; set; }

    public DateTime? CompletionRequestedAt { get; set; }

    public DateTime? CompletionApprovedAt { get; set; }

    public Guid? CompletionApprovedByUserId { get; set; }

    /*
     * Projeyi oluşturan kullanıcı.
     */
    public Guid OwnerId { get; set; }

    public User Owner { get; set; } =
        null!;

    /*
     * Projeden sorumlu ProjectManager.
     *
     * Admin oluşturduğunda:
     * departmanın yöneticisi buraya atanır.
     *
     * ProjectManager oluşturduğunda:
     * kendisi buraya atanır.
     */
    public Guid ProjectManagerId { get; set; }

    public User ProjectManager { get; set; } =
        null!;

    /*
     * Artık proje mutlaka departmana bağlı.
     */
    public Guid DepartmentId { get; set; }

    public Department Department { get; set; } =
        null!;

    public ICollection<ProjectMember> Members { get; set; } =
        new List<ProjectMember>();

    public ICollection<ProjectTask> Tasks { get; set; } =
        new List<ProjectTask>();

    public ICollection<ProjectMessage> Messages { get; set; } =
        new List<ProjectMessage>();
}