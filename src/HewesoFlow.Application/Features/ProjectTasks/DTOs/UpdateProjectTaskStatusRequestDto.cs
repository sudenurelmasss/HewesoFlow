using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Application.Features.ProjectTasks.DTOs;

public class UpdateProjectTaskStatusRequestDto
{
    public ProjectTaskStatus Status { get; set; }
}