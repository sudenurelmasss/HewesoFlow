using HewesoFlow.Domain.Entities;

using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.Contexts;

public class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    /* =========================================================
       TABLES
       ========================================================= */

    public DbSet<User> Users =>
        Set<User>();

    public DbSet<Role> Roles =>
        Set<Role>();

    public DbSet<UserRole> UserRoles =>
        Set<UserRole>();

    public DbSet<Department> Departments =>
        Set<Department>();

    public DbSet<Project> Projects =>
        Set<Project>();

    public DbSet<ProjectMember> ProjectMembers =>
        Set<ProjectMember>();

    public DbSet<ProjectTask> ProjectTasks =>
        Set<ProjectTask>();

    public DbSet<Comment> Comments =>
        Set<Comment>();

    public DbSet<TaskHistory> TaskHistories =>
        Set<TaskHistory>();

    public DbSet<TaskChecklistItem> TaskChecklistItems =>
        Set<TaskChecklistItem>();

    public DbSet<Tag> Tags =>
        Set<Tag>();

    public DbSet<ProjectTaskTag> ProjectTaskTags =>
        Set<ProjectTaskTag>();

    public DbSet<ProjectTaskDependency> ProjectTaskDependencies =>
        Set<ProjectTaskDependency>();

    public DbSet<ProjectDependency> ProjectDependencies =>
        Set<ProjectDependency>();

    public DbSet<TaskAttachment> TaskAttachments =>
        Set<TaskAttachment>();

    public DbSet<Notification> Notifications =>
        Set<Notification>();

    public DbSet<ProjectMessage> ProjectMessages =>
        Set<ProjectMessage>();

    public DbSet<Meeting> Meetings =>
        Set<Meeting>();

    public DbSet<MeetingParticipant> MeetingParticipants =>
        Set<MeetingParticipant>();

    /* =========================================================
       MODEL CONFIGURATION
       ========================================================= */

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(
            modelBuilder);

        ConfigureUser(
            modelBuilder);

        ConfigureUserRole(
            modelBuilder);

        ConfigureDepartment(
            modelBuilder);

        ConfigureProject(
            modelBuilder);

        ConfigureProjectMember(
            modelBuilder);

        ConfigureProjectTask(
            modelBuilder);

        ConfigureComment(
            modelBuilder);

        ConfigureTaskHistory(
            modelBuilder);

        ConfigureTaskChecklistItem(
            modelBuilder);

        ConfigureTag(
            modelBuilder);

        ConfigureProjectTaskTag(
            modelBuilder);

        ConfigureProjectTaskDependency(
            modelBuilder);

        ConfigureProjectDependency(
            modelBuilder);

        ConfigureTaskAttachment(
            modelBuilder);

        ConfigureNotification(
            modelBuilder);

        ConfigureProjectMessage(
            modelBuilder);

        ConfigureMeeting(
            modelBuilder);

        ConfigureMeetingParticipant(
            modelBuilder);
    }

    /* =========================================================
       USER
       ========================================================= */

    private static void ConfigureUser(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.FirstName)
                    .IsRequired()
                    .HasMaxLength(
                        100);

                entity.Property(
                        x =>
                            x.LastName)
                    .IsRequired()
                    .HasMaxLength(
                        100);

                entity.Property(
                        x =>
                            x.Email)
                    .IsRequired()
                    .HasMaxLength(
                        250);

                entity.HasIndex(
                        x =>
                            x.Email)
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.DepartmentEntity)
                    .WithMany(
                        x =>
                            x.Users)
                    .HasForeignKey(
                        x =>
                            x.DepartmentId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       USER ROLE
       ========================================================= */

    private static void ConfigureUserRole(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserRole>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.UserId,
                                x.RoleId
                            })
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany(
                        x =>
                            x.UserRoles)
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.Role)
                    .WithMany(
                        x =>
                            x.UserRoles)
                    .HasForeignKey(
                        x =>
                            x.RoleId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.AssignedByUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.AssignedByUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       DEPARTMENT
       ========================================================= */

    private static void ConfigureDepartment(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Department>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Name)
                    .IsRequired()
                    .HasMaxLength(
                        150);

                entity.Property(
                        x =>
                            x.Description)
                    .HasMaxLength(
                        500);

                entity.HasIndex(
                        x =>
                            x.Name)
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.Manager)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ManagerId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       PROJECT
       ========================================================= */

    private static void ConfigureProject(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Name)
                    .IsRequired()
                    .HasMaxLength(
                        200);

                entity.Property(
                        x =>
                            x.Description)
                    .IsRequired();

                entity.HasOne(
                        x =>
                            x.Owner)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.OwnerId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.ProjectManager)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ProjectManagerId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.Department)
                    .WithMany(
                        x =>
                            x.Projects)
                    .HasForeignKey(
                        x =>
                            x.DepartmentId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        x.DepartmentId);

                entity.HasIndex(
                    x =>
                        x.ProjectManagerId);
            });
    }

    /* =========================================================
       PROJECT MEMBER
       ========================================================= */

    private static void ConfigureProjectMember(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectMember>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.ProjectId,
                                x.UserId
                            })
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.Project)
                    .WithMany(
                        x =>
                            x.Members)
                    .HasForeignKey(
                        x =>
                            x.ProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       PROJECT TASK
       ========================================================= */

    private static void ConfigureProjectTask(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectTask>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Title)
                    .IsRequired()
                    .HasMaxLength(
                        200);

                entity.Property(
                        x =>
                            x.Description)
                    .IsRequired();

                entity.HasOne(
                        x =>
                            x.Project)
                    .WithMany(
                        x =>
                            x.Tasks)
                    .HasForeignKey(
                        x =>
                            x.ProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.AssignedUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.AssignedUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.CreatedByUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.ParentTask)
                    .WithMany(
                        x =>
                            x.Subtasks)
                    .HasForeignKey(
                        x =>
                            x.ParentTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        x.ParentTaskId);
            });
    }

    /* =========================================================
       COMMENT
       ========================================================= */

    private static void ConfigureComment(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Comment>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Content)
                    .IsRequired()
                    .HasMaxLength(
                        2000);

                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany(
                        x =>
                            x.Comments)
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.RecipientUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.RecipientUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        x.ProjectTaskId);

                entity.HasIndex(
                    x =>
                        x.RecipientUserId);
            });
    }

    /* =========================================================
       TASK HISTORY
       ========================================================= */

    private static void ConfigureTaskHistory(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskHistory>(
            entity =>
            {
                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany(
                        x =>
                            x.TaskHistories)
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       TASK CHECKLIST
       ========================================================= */

    private static void ConfigureTaskChecklistItem(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskChecklistItem>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Title)
                    .IsRequired()
                    .HasMaxLength(
                        250);

                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany(
                        x =>
                            x.ChecklistItems)
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        x.ProjectTaskId);
            });
    }

    /* =========================================================
       TAG
       ========================================================= */

    private static void ConfigureTag(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tag>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Name)
                    .IsRequired()
                    .HasMaxLength(
                        50);

                entity.HasIndex(
                        x =>
                            x.Name)
                    .IsUnique();
            });
    }

    /* =========================================================
       PROJECT TASK TAG
       ========================================================= */

    private static void ConfigureProjectTaskTag(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectTaskTag>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.ProjectTaskId,
                                x.TagId
                            })
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany(
                        x =>
                            x.TaskTags)
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.Tag)
                    .WithMany(
                        x =>
                            x.TaskTags)
                    .HasForeignKey(
                        x =>
                            x.TagId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       PROJECT TASK DEPENDENCY
       ========================================================= */

    private static void ConfigureProjectTaskDependency(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectTaskDependency>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.ProjectTaskId,
                                x.DependsOnTaskId
                            })
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.DependsOnTask)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.DependsOnTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       PROJECT DEPENDENCY
       ========================================================= */

    private static void ConfigureProjectDependency(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectDependency>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.ProjectId,
                                x.DependsOnProjectId
                            })
                    .IsUnique();

                entity.HasOne(
                        x =>
                            x.Project)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.DependsOnProject)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.DependsOnProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       TASK ATTACHMENT
       ========================================================= */

    private static void ConfigureTaskAttachment(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskAttachment>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.OriginalFileName)
                    .IsRequired()
                    .HasMaxLength(
                        255);

                entity.Property(
                        x =>
                            x.StoredFileName)
                    .IsRequired()
                    .HasMaxLength(
                        255);

                entity.Property(
                        x =>
                            x.ContentType)
                    .IsRequired()
                    .HasMaxLength(
                        150);

                entity.HasOne(
                        x =>
                            x.ProjectTask)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ProjectTaskId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.UploadedByUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UploadedByUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        x.ProjectTaskId);
            });
    }

    /* =========================================================
       NOTIFICATION
       ========================================================= */

    private static void ConfigureNotification(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Title)
                    .IsRequired()
                    .HasMaxLength(
                        150);

                entity.Property(
                        x =>
                            x.Message)
                    .IsRequired()
                    .HasMaxLength(
                        1000);

                entity.Property(
                        x =>
                            x.RelatedEntityType)
                    .HasMaxLength(
                        50);

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasIndex(
                    x =>
                        new
                        {
                            x.UserId,
                            x.IsRead,
                            x.IsDeleted
                        });

                entity.HasIndex(
                    x =>
                        x.CreatedAt);
            });
    }

    /* =========================================================
       PROJECT MESSAGE
       ========================================================= */

    private static void ConfigureProjectMessage(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectMessage>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Content)
                    .IsRequired()
                    .HasMaxLength(
                        3000);

                entity.HasIndex(
                    x =>
                        x.ProjectId);

                entity.HasIndex(
                    x =>
                        x.SenderUserId);

                entity.HasIndex(
                    x =>
                        x.RecipientUserId);

                entity.HasOne(
                        x =>
                            x.Project)
                    .WithMany(
                        x =>
                            x.Messages)
                    .HasForeignKey(
                        x =>
                            x.ProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.SenderUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.SenderUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.RecipientUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.RecipientUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       MEETING
       ========================================================= */

    private static void ConfigureMeeting(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Meeting>(
            entity =>
            {
                entity.Property(
                        x =>
                            x.Title)
                    .IsRequired()
                    .HasMaxLength(
                        160);

                entity.Property(
                        x =>
                            x.Description)
                    .HasMaxLength(
                        2000);

                entity.Property(
                        x =>
                            x.AudienceLabel)
                    .IsRequired()
                    .HasMaxLength(
                        500);

                entity.Property(
                        x =>
                            x.RoomName)
                    .IsRequired()
                    .HasMaxLength(
                        200);

                entity.HasIndex(
                        x =>
                            x.RoomName)
                    .IsUnique();

                entity.HasIndex(
                    x =>
                        x.StartDateTime);

                entity.HasIndex(
                    x =>
                        x.ProjectId);

                entity.HasOne(
                        x =>
                            x.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.CreatedByUserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne(
                        x =>
                            x.Project)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.ProjectId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }

    /* =========================================================
       MEETING PARTICIPANT
       ========================================================= */

    private static void ConfigureMeetingParticipant(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MeetingParticipant>(
            entity =>
            {
                entity.HasIndex(
                        x =>
                            new
                            {
                                x.MeetingId,
                                x.UserId
                            })
                    .IsUnique();

                entity.HasIndex(
                    x =>
                        x.UserId);

                entity.HasOne(
                        x =>
                            x.Meeting)
                    .WithMany(
                        x =>
                            x.Participants)
                    .HasForeignKey(
                        x =>
                            x.MeetingId)
                    .OnDelete(
                        DeleteBehavior.Cascade);

                entity.HasOne(
                        x =>
                            x.User)
                    .WithMany()
                    .HasForeignKey(
                        x =>
                            x.UserId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }
}