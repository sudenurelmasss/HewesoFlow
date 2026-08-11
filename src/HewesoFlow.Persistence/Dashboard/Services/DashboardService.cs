using HewesoFlow.Application.Abstractions.Dashboard;
using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Features.Dashboard.DTOs;
using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Persistence.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var ownedProjects =
            await _unitOfWork.Projects.FindAsync(
                project =>
                    project.OwnerId == currentUserId &&
                    !project.IsDeleted,
                cancellationToken);

        var memberProjects =
            await _unitOfWork.ProjectMembers.FindAsync(
                member =>
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        var accessibleProjectIds =
            ownedProjects
                .Select(project => project.Id)
                .Concat(
                    memberProjects.Select(
                        member => member.ProjectId))
                .Distinct()
                .ToHashSet();

        if (accessibleProjectIds.Count == 0)
        {
            return new DashboardSummaryDto();
        }

        var projectTasks =
            await _unitOfWork.ProjectTasks.FindAsync(
                task =>
                    accessibleProjectIds.Contains(task.ProjectId) &&
                    !task.IsDeleted,
                cancellationToken);

        var totalTasks = projectTasks.Count;

        var completedTasks =
            projectTasks.Count(
                task =>
                    task.Status ==
                    ProjectTaskStatus.Done);

        var completionPercentage =
            totalTasks == 0
                ? 0
                : Math.Round(
                    (decimal)completedTasks /
                    totalTasks *
                    100,
                    2);

        var now = DateTime.UtcNow;

        return new DashboardSummaryDto
        {
            TotalProjects =
                accessibleProjectIds.Count,

            TotalTasks =
                totalTasks,

            TodoTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.Todo),

            InProgressTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InProgress),

            InReviewTasks =
                projectTasks.Count(
                    task =>
                        task.Status ==
                        ProjectTaskStatus.InReview),

            CompletedTasks =
                completedTasks,

            OverdueTasks =
                projectTasks.Count(
                    task =>
                        task.DueDate.HasValue &&
                        task.DueDate.Value < now &&
                        task.Status !=
                        ProjectTaskStatus.Done),

            AssignedToMeTasks =
                projectTasks.Count(
                    task =>
                        task.AssignedUserId ==
                        currentUserId),

            CompletionPercentage =
                completionPercentage
        };
    }
}