namespace HewesoFlow.Application.Features.Dashboard.DTOs;

public class DashboardSummaryDto
{
    /*
     * ADMIN:
     * Sistemdeki tüm projeler.
     *
     * PROJECT MANAGER / TEAM MEMBER:
     * Kullanıcının erişebildiği projeler.
     */
    public int TotalProjects { get; set; }

    /*
     * ADMIN:
     * Sistemdeki tüm görevler.
     *
     * PROJECT MANAGER / TEAM MEMBER:
     * Kullanıcının erişebildiği projelerdeki görevler.
     */
    public int TotalTasks { get; set; }

    /*
     * Görev bazlı alanlar.
     * Project Manager ve Team Member dashboardları
     * kullanmaya devam edebilir.
     */
    public int TodoTasks { get; set; }

    public int InProgressTasks { get; set; }

    public int InReviewTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int OverdueTasks { get; set; }

    public int AssignedToMeTasks { get; set; }

    public decimal CompletionPercentage { get; set; }

    /*
     * ADMIN DASHBOARD'A ÖZEL PROJE SAYILARI
     *
     * Devam eden:
     * - Planning
     * - Active
     * - OnHold
     * - PendingApproval
     * - Status Completed olsa bile PM onayı gerekiyorsa
     *   ve henüz onay verilmediyse devam eden kabul edilir.
     */
    public int ActiveProjects { get; set; }

    /*
     * Gerçekten tamamlanan projeler.
     *
     * PM onayı gerekmiyorsa:
     * Status = Completed yeterlidir.
     *
     * PM onayı gerekiyorsa:
     * Status = Completed +
     * CompletionApprovedAt dolu olmalıdır.
     */
    public int CompletedProjects { get; set; }
}