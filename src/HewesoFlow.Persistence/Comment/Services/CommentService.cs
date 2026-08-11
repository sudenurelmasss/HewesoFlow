using HewesoFlow.Application.Abstractions.Comments;
using HewesoFlow.Application.Abstractions.Persistence;
using HewesoFlow.Application.Features.Comments.DTOs;
using HewesoFlow.Domain.Entities;

namespace HewesoFlow.Persistence.Comments.Services;

public class CommentService : ICommentService
{
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CommentResponseDto> CreateAsync(
        Guid projectTaskId,
        CreateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var content = request.Content.Trim();

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException(
                "Yorum içeriği boş bırakılamaz.");
        }

        if (content.Length > 2000)
        {
            throw new ArgumentException(
                "Yorum en fazla 2000 karakter olabilir.");
        }

        var projectTask = await GetAccessibleTaskAsync(
            projectTaskId,
            currentUserId,
            cancellationToken);

        var userExists =
            await _unitOfWork.Users.AnyAsync(
                user =>
                    user.Id == currentUserId &&
                    user.IsActive &&
                    !user.IsDeleted,
                cancellationToken);

        if (!userExists)
        {
            throw new InvalidOperationException(
                "Yorum yazacak aktif kullanıcı bulunamadı.");
        }

        var comment = new Comment
        {
            Content = content,
            ProjectTaskId = projectTask.Id,
            UserId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _unitOfWork.Comments.AddAsync(
            comment,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return await MapToResponseAsync(
            comment,
            cancellationToken);
    }

    public async Task<IReadOnlyList<CommentResponseDto>> GetByTaskIdAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            projectTaskId,
            currentUserId,
            cancellationToken);

        var comments =
            await _unitOfWork.Comments.FindAsync(
                comment =>
                    comment.ProjectTaskId == projectTaskId &&
                    !comment.IsDeleted,
                cancellationToken);

        var result = new List<CommentResponseDto>();

        foreach (var comment in comments
                     .OrderBy(comment => comment.CreatedAt))
        {
            result.Add(
                await MapToResponseAsync(
                    comment,
                    cancellationToken));
        }

        return result;
    }

    public async Task<CommentResponseDto> UpdateAsync(
        Guid commentId,
        UpdateCommentRequestDto request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var comment =
            await _unitOfWork.Comments.FirstOrDefaultAsync(
                comment =>
                    comment.Id == commentId &&
                    !comment.IsDeleted,
                cancellationToken);

        if (comment is null)
        {
            throw new KeyNotFoundException(
                "Yorum bulunamadı.");
        }

        await GetAccessibleTaskAsync(
            comment.ProjectTaskId,
            currentUserId,
            cancellationToken);

        if (comment.UserId != currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yorumunuzu düzenleyebilirsiniz.");
        }

        var content = request.Content.Trim();

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException(
                "Yorum içeriği boş bırakılamaz.");
        }

        if (content.Length > 2000)
        {
            throw new ArgumentException(
                "Yorum en fazla 2000 karakter olabilir.");
        }

        comment.Content = content;
        comment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Comments.Update(comment);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return await MapToResponseAsync(
            comment,
            cancellationToken);
    }

    public async Task DeleteAsync(
        Guid commentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var comment =
            await _unitOfWork.Comments.FirstOrDefaultAsync(
                comment =>
                    comment.Id == commentId &&
                    !comment.IsDeleted,
                cancellationToken);

        if (comment is null)
        {
            throw new KeyNotFoundException(
                "Yorum bulunamadı.");
        }

        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                task =>
                    task.Id == comment.ProjectTaskId &&
                    !task.IsDeleted,
                cancellationToken);

        if (projectTask is null)
        {
            throw new KeyNotFoundException(
                "Yorumun bağlı olduğu görev bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        var userOwnsComment =
            comment.UserId == currentUserId;

        var userOwnsProject =
            project.OwnerId == currentUserId;

        if (!userOwnsComment &&
            !userOwnsProject)
        {
            throw new UnauthorizedAccessException(
                "Bu yorumu silme yetkiniz bulunmamaktadır.");
        }

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Comments.Update(comment);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);
    }

    private async Task<ProjectTask> GetAccessibleTaskAsync(
        Guid projectTaskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                task =>
                    task.Id == projectTaskId &&
                    !task.IsDeleted,
                cancellationToken);

        if (projectTask is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        var project =
            await _unitOfWork.Projects.FirstOrDefaultAsync(
                project =>
                    project.Id == projectTask.ProjectId &&
                    !project.IsDeleted,
                cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Görevin bağlı olduğu proje bulunamadı.");
        }

        var userOwnsProject =
            project.OwnerId == currentUserId;

        var userIsProjectMember =
            await _unitOfWork.ProjectMembers.AnyAsync(
                member =>
                    member.ProjectId == project.Id &&
                    member.UserId == currentUserId &&
                    member.IsActive &&
                    !member.IsDeleted,
                cancellationToken);

        if (!userOwnsProject &&
            !userIsProjectMember)
        {
            throw new UnauthorizedAccessException(
                "Bu görevin yorumlarına erişim yetkiniz bulunmamaktadır.");
        }

        return projectTask;
    }

    private async Task<CommentResponseDto> MapToResponseAsync(
        Comment comment,
        CancellationToken cancellationToken)
    {
        var projectTask =
            await _unitOfWork.ProjectTasks.FirstOrDefaultAsync(
                task =>
                    task.Id == comment.ProjectTaskId,
                cancellationToken);

        var user =
            await _unitOfWork.Users.FirstOrDefaultAsync(
                user =>
                    user.Id == comment.UserId,
                cancellationToken);

        return new CommentResponseDto
        {
            Id = comment.Id,
            Content = comment.Content,
            ProjectTaskId = comment.ProjectTaskId,

            ProjectTaskTitle =
                projectTask?.Title ?? string.Empty,

            UserId = comment.UserId,

            UserFullName =
                user is null
                    ? string.Empty
                    : $"{user.FirstName} {user.LastName}",

            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }
}