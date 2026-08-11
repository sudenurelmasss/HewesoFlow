using HewesoFlow.Application.Abstractions.TaskAttachments;
using HewesoFlow.Application.Features.TaskAttachments.DTOs;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Persistence.TaskAttachments.Services;

public class TaskAttachmentService : ITaskAttachmentService
{
    private const long MaxFileSize =
        10 * 1024 * 1024;

    private static readonly HashSet<string>
        AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".pdf",
            ".txt",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".zip"
        };

    private readonly AppDbContext _context;

    private readonly string _uploadRoot;

    public TaskAttachmentService(
        AppDbContext context)
    {
        _context = context;

        _uploadRoot =
            Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads",
                "tasks");

        Directory.CreateDirectory(
            _uploadRoot);
    }

    public async Task<TaskAttachmentDto> UploadAsync(
        Guid taskId,
        UploadTaskAttachmentRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        ValidateFile(request);

        var originalFileName =
            Path.GetFileName(
                request.FileName);

        var extension =
            Path.GetExtension(
                originalFileName);

        var storedFileName =
            $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";

        var storedPath =
            Path.Combine(
                _uploadRoot,
                storedFileName);

        await using (
            var fileStream =
                new FileStream(
                    storedPath,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None,
                    81920,
                    true))
        {
            await request.Content.CopyToAsync(
                fileStream,
                cancellationToken);
        }

        var attachment =
            new TaskAttachment
            {
                Id = Guid.NewGuid(),

                ProjectTaskId =
                    taskId,

                UploadedByUserId =
                    currentUserId,

                OriginalFileName =
                    originalFileName,

                StoredFileName =
                    storedFileName,

                ContentType =
                    string.IsNullOrWhiteSpace(
                        request.ContentType)
                        ? "application/octet-stream"
                        : request.ContentType.Trim(),

                FileSize =
                    request.Length,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        try
        {
            await _context.TaskAttachments.AddAsync(
                attachment,
                cancellationToken);

            await _context.SaveChangesAsync(
                cancellationToken);
        }
        catch
        {
            if (File.Exists(storedPath))
            {
                File.Delete(storedPath);
            }

            throw;
        }

        var user =
            await _context.Users
                .AsNoTracking()
                .FirstAsync(
                    x =>
                        x.Id ==
                        currentUserId,
                    cancellationToken);

        return new TaskAttachmentDto
        {
            Id = attachment.Id,

            ProjectTaskId =
                attachment.ProjectTaskId,

            UploadedByUserId =
                attachment.UploadedByUserId,

            UploadedByUserName =
                $"{user.FirstName} {user.LastName}"
                    .Trim(),

            OriginalFileName =
                attachment.OriginalFileName,

            ContentType =
                attachment.ContentType,

            FileSize =
                attachment.FileSize,

            CreatedAt =
                attachment.CreatedAt
        };
    }

    public async Task<IReadOnlyList<TaskAttachmentDto>> GetAllAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        return await _context.TaskAttachments
            .AsNoTracking()
            .Where(x =>
                x.ProjectTaskId == taskId &&
                !x.IsDeleted)
            .OrderByDescending(
                x => x.CreatedAt)
            .Select(x =>
                new TaskAttachmentDto
                {
                    Id = x.Id,

                    ProjectTaskId =
                        x.ProjectTaskId,

                    UploadedByUserId =
                        x.UploadedByUserId,

                    UploadedByUserName =
                        (x.UploadedByUser.FirstName +
                         " " +
                         x.UploadedByUser.LastName)
                        .Trim(),

                    OriginalFileName =
                        x.OriginalFileName,

                    ContentType =
                        x.ContentType,

                    FileSize =
                        x.FileSize,

                    CreatedAt =
                        x.CreatedAt
                })
            .ToListAsync(
                cancellationToken);
    }

    public async Task<TaskAttachmentDownloadDto> DownloadAsync(
        Guid taskId,
        Guid attachmentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        await GetAccessibleTaskAsync(
            taskId,
            currentUserId,
            cancellationToken);

        var attachment =
            await _context.TaskAttachments
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                        attachmentId &&
                        x.ProjectTaskId ==
                        taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (attachment is null)
        {
            throw new KeyNotFoundException(
                "Dosya bulunamadı.");
        }

        var storedPath =
            Path.Combine(
                _uploadRoot,
                attachment.StoredFileName);

        if (!File.Exists(storedPath))
        {
            throw new FileNotFoundException(
                "Dosyanın fiziksel içeriği bulunamadı.");
        }

        var bytes =
            await File.ReadAllBytesAsync(
                storedPath,
                cancellationToken);

        return new TaskAttachmentDownloadDto
        {
            Content =
                bytes,

            FileName =
                attachment.OriginalFileName,

            ContentType =
                attachment.ContentType
        };
    }

    public async Task DeleteAsync(
        Guid taskId,
        Guid attachmentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var task =
            await GetAccessibleTaskAsync(
                taskId,
                currentUserId,
                cancellationToken);

        var attachment =
            await _context.TaskAttachments
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                        attachmentId &&
                        x.ProjectTaskId ==
                        taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (attachment is null)
        {
            throw new KeyNotFoundException(
                "Dosya bulunamadı.");
        }

        var isAdmin =
            await IsAdminAsync(
                currentUserId,
                cancellationToken);

        var isProjectOwner =
            await _context.Projects
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.Id ==
                        task.ProjectId &&
                        x.OwnerId ==
                        currentUserId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (attachment.UploadedByUserId !=
                currentUserId &&
            !isAdmin &&
            !isProjectOwner)
        {
            throw new UnauthorizedAccessException(
                "Bu dosyayı silme yetkiniz bulunmamaktadır.");
        }

        attachment.IsDeleted =
            true;

        attachment.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        var storedPath =
            Path.Combine(
                _uploadRoot,
                attachment.StoredFileName);

        if (File.Exists(storedPath))
        {
            File.Delete(storedPath);
        }
    }

    private static void ValidateFile(
        UploadTaskAttachmentRequest request)
    {
        if (request.Content is null ||
            request.Content == Stream.Null)
        {
            throw new ArgumentException(
                "Dosya içeriği bulunamadı.");
        }

        if (request.Length <= 0)
        {
            throw new ArgumentException(
                "Boş dosya yüklenemez.");
        }

        if (request.Length >
            MaxFileSize)
        {
            throw new ArgumentException(
                "Dosya boyutu en fazla 10 MB olabilir.");
        }

        var fileName =
            Path.GetFileName(
                request.FileName);

        if (string.IsNullOrWhiteSpace(
                fileName))
        {
            throw new ArgumentException(
                "Dosya adı geçersiz.");
        }

        var extension =
            Path.GetExtension(
                fileName);

        if (string.IsNullOrWhiteSpace(
                extension) ||
            !AllowedExtensions.Contains(
                extension))
        {
            throw new ArgumentException(
                "Bu dosya türünün yüklenmesine izin verilmiyor.");
        }
    }

    private async Task<ProjectTask> GetAccessibleTaskAsync(
        Guid taskId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var task =
            await _context.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                        taskId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (task is null)
        {
            throw new KeyNotFoundException(
                "Görev bulunamadı.");
        }

        if (await IsAdminAsync(
                currentUserId,
                cancellationToken))
        {
            return task;
        }

        var project =
            await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                        task.ProjectId &&
                        !x.IsDeleted,
                    cancellationToken);

        if (project is null)
        {
            throw new KeyNotFoundException(
                "Proje bulunamadı.");
        }

        if (project.OwnerId ==
            currentUserId)
        {
            return task;
        }

        var isMember =
            await _context.ProjectMembers
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.ProjectId ==
                        task.ProjectId &&
                        x.UserId ==
                        currentUserId &&
                        x.IsActive &&
                        !x.IsDeleted,
                    cancellationToken);

        if (!isMember)
        {
            throw new UnauthorizedAccessException(
                "Bu görevin dosyalarına erişim yetkiniz bulunmamaktadır.");
        }

        return task;
    }

    private async Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.UserId ==
                        userId &&
                    x.IsActive &&
                    !x.IsDeleted &&
                    x.Role.IsActive &&
                    !x.Role.IsDeleted &&
                    x.Role.Name ==
                        "Admin",
                cancellationToken);
    }
}