using HewesoFlow.Application.Abstractions.Authentication;
using HewesoFlow.Application.Abstractions.Comments;
using HewesoFlow.Application.Abstractions.Dashboard;
using HewesoFlow.Application.Abstractions.Departments;
using HewesoFlow.Application.Abstractions.Dependencies;
using HewesoFlow.Application.Abstractions.Notifications;
using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Abstractions.ProjectMembers;
using HewesoFlow.Application.Abstractions.Projects;
using HewesoFlow.Application.Abstractions.ProjectTasks;
using HewesoFlow.Application.Abstractions.Reports;
using HewesoFlow.Application.Abstractions.Search;
using HewesoFlow.Application.Abstractions.TaskAttachments;
using HewesoFlow.Application.Abstractions.TaskHistories;
using HewesoFlow.Application.Abstractions.Users;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Authentication.Services;
using HewesoFlow.Persistence.Comments.Services;
using HewesoFlow.Persistence.Contexts;
using HewesoFlow.Persistence.Dashboard.Services;
using HewesoFlow.Persistence.Departments;
using HewesoFlow.Persistence.Dependencies;
using HewesoFlow.Persistence.Notifications.Services;
using HewesoFlow.Persistence.ProjectMembers.Services;
using HewesoFlow.Persistence.Projects.Services;
using HewesoFlow.Persistence.ProjectTasks.Services;
using HewesoFlow.Persistence.Reports.Services;
using HewesoFlow.Persistence.Repositories;
using HewesoFlow.Persistence.Search.Services;
using HewesoFlow.Persistence.TaskAttachments.Services;
using HewesoFlow.Persistence.TaskHistories.Services;
using HewesoFlow.Persistence.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HewesoFlow.Persistence.DependencyInjection;

public static class PersistenceServiceRegistration
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(
                configuration.GetConnectionString(
                    "DefaultConnection"));
        });

        services.AddScoped<
            IAuthService,
            AuthService>();

        services.AddScoped<
            IPasswordHasher<User>,
            PasswordHasher<User>>();

        services.AddScoped(
            typeof(IGenericRepository<>),
            typeof(GenericRepository<>));

        services.AddScoped<
            IUnitOfWork,
            UnitOfWork>();

        services.AddScoped<
            IProjectService,
            ProjectService>();

        services.AddScoped<
            IProjectMemberService,
            ProjectMemberService>();

        services.AddScoped<
            ProjectTaskService>();

        services.AddScoped<
            IProjectTaskService,
            NotificationProjectTaskService>();

        services.AddScoped<
            ITaskAdvancedService,
            TaskAdvancedService>();

        services.AddScoped<
            IDependencyService,
            DependencyService>();

        services.AddScoped<
            ITaskAttachmentService,
            TaskAttachmentService>();

        services.AddScoped<
            INotificationService,
            NotificationService>();

        services.AddScoped<
            CommentService>();

        services.AddScoped<
            ICommentService,
            NotificationCommentService>();

        services.AddScoped<
            IGlobalSearchService,
            GlobalSearchService>();

        services.AddScoped<
            IReportService,
            ReportService>();

        services.AddScoped<
            ITaskHistoryService,
            TaskHistoryService>();

        services.AddScoped<
            IDashboardService,
            DashboardService>();

        services.AddScoped<
            IUserService,
            UserService>();

        services.AddScoped<
            IDepartmentService,
            DepartmentService>();

        return services;
    }
}