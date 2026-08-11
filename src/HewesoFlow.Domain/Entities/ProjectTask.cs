using HewesoFlow.Domain.Enums;

namespace HewesoFlow.Domain.Entities;

public class ProjectTask : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid ProjectId { get; set; }

    public Guid? AssignedUserId { get; set; }

    public Guid CreatedByUserId { get; set; }

    public Guid? ParentTaskId { get; set; }

    public ProjectTaskStatus Status { get; set; }
        = ProjectTaskStatus.Todo;

    public TaskPriority Priority { get; set; }
        = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public Project Project { get; set; } = null!;

    public User? AssignedUser { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public ProjectTask? ParentTask { get; set; }

    public ICollection<ProjectTask> Subtasks { get; set; }
        = new List<ProjectTask>();

    public ICollection<TaskChecklistItem> ChecklistItems { get; set; }
        = new List<TaskChecklistItem>();

    public ICollection<ProjectTaskTag> TaskTags { get; set; }
        = new List<ProjectTaskTag>();

    public ICollection<Comment> Comments { get; set; }
        = new List<Comment>();

    public ICollection<TaskHistory> TaskHistories { get; set; }
        = new List<TaskHistory>();
}