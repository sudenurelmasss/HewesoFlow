using HewesoFlow.Application.Abstractions.Departments;
using HewesoFlow.Application.Features.Departments.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HewesoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(
        IDepartmentService departmentService)
    {
        _departmentService =
            departmentService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var departments =
            await _departmentService.GetAllAsync(
                cancellationToken);

        return Ok(departments);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var department =
            await _departmentService.GetByIdAsync(
                id,
                cancellationToken);

        if (department is null)
        {
            return NotFound(new
            {
                message =
                    "Departman bulunamadı."
            });
        }

        return Ok(department);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody]
        CreateDepartmentRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var department =
                await _departmentService.CreateAsync(
                    request,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = department.Id
                },
                department);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message =
                    exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message =
                    exception.Message
            });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody]
        UpdateDepartmentRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request.Id != Guid.Empty &&
            request.Id != id)
        {
            return BadRequest(new
            {
                message =
                    "Adres içerisindeki departman kimliği ile gönderilen kimlik uyuşmuyor."
            });
        }

        request.Id = id;

        try
        {
            var department =
                await _departmentService.UpdateAsync(
                    request,
                    cancellationToken);

            if (department is null)
            {
                return NotFound(new
                {
                    message =
                        "Departman bulunamadı."
                });
            }

            return Ok(department);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message =
                    exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message =
                    exception.Message
            });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result =
            await _departmentService.DeleteAsync(
                id,
                cancellationToken);

        if (!result)
        {
            return NotFound(new
            {
                message =
                    "Departman bulunamadı."
            });
        }

        return Ok(new
        {
            message =
                "Departman başarıyla silindi."
        });
    }

    [HttpPatch(
        "{id:guid}/manager/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignManager(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var result =
            await _departmentService.AssignManagerAsync(
                id,
                userId,
                cancellationToken);

        if (!result)
        {
            return NotFound(new
            {
                message =
                    "Departman veya aktif kullanıcı bulunamadı."
            });
        }

        return Ok(new
        {
            message =
                "Departman yöneticisi başarıyla atandı."
        });
    }

    [HttpPatch(
        "{id:guid}/users/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignUser(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var result =
            await _departmentService.AssignUserAsync(
                id,
                userId,
                cancellationToken);

        if (!result)
        {
            return NotFound(new
            {
                message =
                    "Departman veya aktif kullanıcı bulunamadı."
            });
        }

        return Ok(new
        {
            message =
                "Kullanıcı departmana başarıyla atandı."
        });
    }
}