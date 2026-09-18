using HewesoFlow.Application.Features.Projects.DTOs;
using HewesoFlow.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/project-manager-options")]
public class ProjectManagerOptionsController :
    ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectManagerOptionsController(
        AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] Guid departmentId,
        CancellationToken cancellationToken)
    {
        if (departmentId ==
            Guid.Empty)
        {
            return BadRequest(
                new
                {
                    message =
                        "Departman seçilmelidir."
                });
        }

        var department =
            await _context.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item =>
                        item.Id ==
                            departmentId &&
                        !item.IsDeleted,
                    cancellationToken);

        if (department is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Departman bulunamadı."
                });
        }

        /*
         * ÖNEMLİ:
         *
         * Departmanın ManagerId alanına
         * kesinlikle bakmıyoruz.
         *
         * Kullanıcının:
         *
         * 1- seçilen departmana kayıtlı olması,
         * 2- aktif olması,
         * 3- UserRoles içinde ProjectManager
         *    rolü bulunması
         *
         * yeterlidir.
         *
         * Böylece aynı departmanda 1, 2, 5 veya
         * daha fazla ProjectManager olabilir.
         */
        var managers =
            await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.DepartmentId ==
                        departmentId &&

                    user.IsActive &&

                    !user.IsDeleted &&

                    user.UserRoles.Any(
                        userRole =>
                            userRole.IsActive &&
                            !userRole.IsDeleted &&

                            userRole.Role.IsActive &&
                            !userRole.Role.IsDeleted &&

                            userRole.Role.Name ==
                                "ProjectManager"))
                .OrderBy(user =>
                    user.FirstName)
                .ThenBy(user =>
                    user.LastName)
                .Select(user =>
                    new ProjectManagerOptionDto
                    {
                        Id =
                            user.Id,

                        FirstName =
                            user.FirstName,

                        LastName =
                            user.LastName,

                        FullName =
                            (
                                user.FirstName +
                                " " +
                                user.LastName
                            ).Trim(),

                        Email =
                            user.Email,

                        DepartmentId =
                            department.Id,

                        DepartmentName =
                            department.Name
                    })
                .ToListAsync(
                    cancellationToken);

        return Ok(
            managers);
    }
}