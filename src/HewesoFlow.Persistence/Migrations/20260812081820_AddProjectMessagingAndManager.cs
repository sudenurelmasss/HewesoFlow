using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HewesoFlow.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectMessagingAndManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(
            MigrationBuilder migrationBuilder)
        {
            /* =====================================================
               PROJECT MANAGER COLUMN

               Eski projeler olduğu için önce nullable oluşturuyoruz.
               Verileri düzelttikten sonra NOT NULL yapacağız.
               ===================================================== */

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectManagerId",
                table: "Projects",
                type: "uniqueidentifier",
                nullable: true);

            /* =====================================================
               ACTIVE PROJECT DATA MIGRATION
               ===================================================== */

            migrationBuilder.Sql(
                """
                /*
                 * AKTİF PROJELER
                 *
                 * Aktif eski proje varsa mümkünse proje sahibinin
                 * departmanını kullan.
                 *
                 * Ancak o departmanın gerçek ve aktif bir
                 * ProjectManager'ı olması gerekir.
                 */

                UPDATE p
                SET p.DepartmentId = u.DepartmentId
                FROM Projects p
                INNER JOIN Users u
                    ON u.Id = p.OwnerId
                INNER JOIN Departments d
                    ON d.Id = u.DepartmentId
                WHERE
                    p.IsDeleted = 0
                    AND p.DepartmentId IS NULL
                    AND u.DepartmentId IS NOT NULL
                    AND u.IsDeleted = 0
                    AND u.IsActive = 1
                    AND d.IsDeleted = 0
                    AND d.IsActive = 1
                    AND d.ManagerId IS NOT NULL
                    AND EXISTS
                    (
                        SELECT 1
                        FROM UserRoles ur
                        INNER JOIN Roles r
                            ON r.Id = ur.RoleId
                        INNER JOIN Users managerUser
                            ON managerUser.Id = d.ManagerId
                        WHERE
                            ur.UserId = d.ManagerId
                            AND ur.IsDeleted = 0
                            AND ur.IsActive = 1
                            AND r.IsDeleted = 0
                            AND r.IsActive = 1
                            AND r.Name = 'ProjectManager'
                            AND managerUser.IsDeleted = 0
                            AND managerUser.IsActive = 1
                    );


                /*
                 * Gerçek ProjectManager'a sahip ilk aktif
                 * departmanı bul.
                 *
                 * Bu değer yalnızca AKTİF eski projeler için
                 * fallback olarak kullanılacak.
                 */

                DECLARE @ActiveFallbackDepartmentId uniqueidentifier;

                SELECT TOP 1
                    @ActiveFallbackDepartmentId = d.Id
                FROM Departments d
                WHERE
                    d.IsDeleted = 0
                    AND d.IsActive = 1
                    AND d.ManagerId IS NOT NULL
                    AND EXISTS
                    (
                        SELECT 1
                        FROM UserRoles ur
                        INNER JOIN Roles r
                            ON r.Id = ur.RoleId
                        INNER JOIN Users managerUser
                            ON managerUser.Id = d.ManagerId
                        WHERE
                            ur.UserId = d.ManagerId
                            AND ur.IsDeleted = 0
                            AND ur.IsActive = 1
                            AND r.IsDeleted = 0
                            AND r.IsActive = 1
                            AND r.Name = 'ProjectManager'
                            AND managerUser.IsDeleted = 0
                            AND managerUser.IsActive = 1
                    )
                ORDER BY d.CreatedAt;


                /*
                 * Aktif ama departmansız eski proje kaldıysa,
                 * geçerli fallback departmanı kullan.
                 */

                IF @ActiveFallbackDepartmentId IS NOT NULL
                BEGIN
                    UPDATE Projects
                    SET DepartmentId =
                        @ActiveFallbackDepartmentId
                    WHERE
                        IsDeleted = 0
                        AND DepartmentId IS NULL;
                END;


                /*
                 * Aktif eski proje hâlâ departmansızsa
                 * migration bilinçli şekilde durur.
                 */

                IF EXISTS
                (
                    SELECT 1
                    FROM Projects
                    WHERE
                        IsDeleted = 0
                        AND DepartmentId IS NULL
                )
                BEGIN
                    THROW 51000,
                    'Aktif eski projelerden en az birine departman atanamadı. Önce ilgili departmana ProjectManager atayın.',
                    1;
                END;


                /*
                 * Aktif projelerin ProjectManager bilgisini
                 * departman yöneticisinden al.
                 */

                UPDATE p
                SET p.ProjectManagerId = d.ManagerId
                FROM Projects p
                INNER JOIN Departments d
                    ON d.Id = p.DepartmentId
                WHERE
                    p.IsDeleted = 0
                    AND p.ProjectManagerId IS NULL
                    AND d.IsDeleted = 0
                    AND d.IsActive = 1
                    AND d.ManagerId IS NOT NULL
                    AND EXISTS
                    (
                        SELECT 1
                        FROM UserRoles ur
                        INNER JOIN Roles r
                            ON r.Id = ur.RoleId
                        INNER JOIN Users managerUser
                            ON managerUser.Id = d.ManagerId
                        WHERE
                            ur.UserId = d.ManagerId
                            AND ur.IsDeleted = 0
                            AND ur.IsActive = 1
                            AND r.IsDeleted = 0
                            AND r.IsActive = 1
                            AND r.Name = 'ProjectManager'
                            AND managerUser.IsDeleted = 0
                            AND managerUser.IsActive = 1
                    );


                /*
                 * Aktif proje geçerli manager alamadıysa
                 * migration durur.
                 */

                IF EXISTS
                (
                    SELECT 1
                    FROM Projects
                    WHERE
                        IsDeleted = 0
                        AND ProjectManagerId IS NULL
                )
                BEGIN
                    THROW 51001,
                    'Aktif eski projelerden en az birinin departmanında geçerli ProjectManager bulunmuyor.',
                    1;
                END;


                /* =================================================
                   SOFT-DELETED OLD PROJECTS

                   Bunlar eski test kayıtları.

                   Gerçek proje iş kurallarına dahil değiller fakat
                   kolonlar NOT NULL olacağı için geçerli FK
                   değerlerine ihtiyaçları var.
                   ================================================= */

                DECLARE @ArchiveDepartmentId uniqueidentifier;

                /*
                 * Manager şartı aramıyoruz.
                 * Yalnızca gerçekten var olan aktif bir departman.
                 */

                SELECT TOP 1
                    @ArchiveDepartmentId = d.Id
                FROM Departments d
                WHERE
                    d.IsDeleted = 0
                    AND d.IsActive = 1
                ORDER BY d.CreatedAt;


                /*
                 * Silinmiş eski projelerde:
                 *
                 * DepartmentId:
                 * ilk gerçek aktif departman.
                 *
                 * ProjectManagerId:
                 * mevcut OwnerId.
                 *
                 * OwnerId zaten Users tablosuna FK olduğundan
                 * geçerli bir kullanıcı ID'sidir.
                 *
                 * Bu değerler yalnızca IsDeleted = 1 kayıtlar için.
                 */

                IF @ArchiveDepartmentId IS NOT NULL
                BEGIN
                    UPDATE Projects
                    SET
                        DepartmentId =
                            COALESCE(
                                DepartmentId,
                                @ArchiveDepartmentId),

                        ProjectManagerId =
                            COALESCE(
                                ProjectManagerId,
                                OwnerId)
                    WHERE
                        IsDeleted = 1;
                END;


                /*
                 * Son güvenlik kontrolü.
                 */

                IF EXISTS
                (
                    SELECT 1
                    FROM Projects
                    WHERE
                        DepartmentId IS NULL
                        OR ProjectManagerId IS NULL
                )
                BEGIN
                    THROW 51002,
                    'Projects tablosundaki eski kayıtların departman veya kullanıcı bilgisi tamamlanamadı.',
                    1;
                END;
                """
            );

            /* =====================================================
               DEPARTMENT REQUIRED
               ===================================================== */

            migrationBuilder.AlterColumn<Guid>(
                name: "DepartmentId",
                table: "Projects",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            /* =====================================================
               PROJECT MANAGER REQUIRED
               ===================================================== */

            migrationBuilder.AlterColumn<Guid>(
                name: "ProjectManagerId",
                table: "Projects",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            /* =====================================================
               COMMENTS
               ===================================================== */

            migrationBuilder.Sql(
                """
                UPDATE Comments
                SET Content = LEFT(Content, 2000)
                WHERE LEN(Content) > 2000;
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Comments",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientUserId",
                table: "Comments",
                type: "uniqueidentifier",
                nullable: true);

            /* =====================================================
               PROJECT MESSAGES
               ===================================================== */

            migrationBuilder.CreateTable(
                name: "ProjectMessages",
                columns: table => new
                {
                    Id =
                        table.Column<Guid>(
                            type: "uniqueidentifier",
                            nullable: false),

                    ProjectId =
                        table.Column<Guid>(
                            type: "uniqueidentifier",
                            nullable: false),

                    SenderUserId =
                        table.Column<Guid>(
                            type: "uniqueidentifier",
                            nullable: false),

                    RecipientUserId =
                        table.Column<Guid>(
                            type: "uniqueidentifier",
                            nullable: true),

                    Content =
                        table.Column<string>(
                            type: "nvarchar(3000)",
                            maxLength: 3000,
                            nullable: false),

                    CreatedAt =
                        table.Column<DateTime>(
                            type: "datetime2",
                            nullable: false),

                    UpdatedAt =
                        table.Column<DateTime>(
                            type: "datetime2",
                            nullable: true),

                    IsDeleted =
                        table.Column<bool>(
                            type: "bit",
                            nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_ProjectMessages",
                        x => x.Id);

                    table.ForeignKey(
                        name:
                            "FK_ProjectMessages_Projects_ProjectId",
                        column:
                            x => x.ProjectId,
                        principalTable:
                            "Projects",
                        principalColumn:
                            "Id",
                        onDelete:
                            ReferentialAction.Restrict);

                    table.ForeignKey(
                        name:
                            "FK_ProjectMessages_Users_RecipientUserId",
                        column:
                            x => x.RecipientUserId,
                        principalTable:
                            "Users",
                        principalColumn:
                            "Id",
                        onDelete:
                            ReferentialAction.Restrict);

                    table.ForeignKey(
                        name:
                            "FK_ProjectMessages_Users_SenderUserId",
                        column:
                            x => x.SenderUserId,
                        principalTable:
                            "Users",
                        principalColumn:
                            "Id",
                        onDelete:
                            ReferentialAction.Restrict);
                });

            /* =====================================================
               INDEXES
               ===================================================== */

            migrationBuilder.CreateIndex(
                name:
                    "IX_Projects_ProjectManagerId",
                table:
                    "Projects",
                column:
                    "ProjectManagerId");

            migrationBuilder.CreateIndex(
                name:
                    "IX_Comments_RecipientUserId",
                table:
                    "Comments",
                column:
                    "RecipientUserId");

            migrationBuilder.CreateIndex(
                name:
                    "IX_ProjectMessages_ProjectId",
                table:
                    "ProjectMessages",
                column:
                    "ProjectId");

            migrationBuilder.CreateIndex(
                name:
                    "IX_ProjectMessages_RecipientUserId",
                table:
                    "ProjectMessages",
                column:
                    "RecipientUserId");

            migrationBuilder.CreateIndex(
                name:
                    "IX_ProjectMessages_SenderUserId",
                table:
                    "ProjectMessages",
                column:
                    "SenderUserId");

            /* =====================================================
               FOREIGN KEYS
               ===================================================== */

            migrationBuilder.AddForeignKey(
                name:
                    "FK_Comments_Users_RecipientUserId",
                table:
                    "Comments",
                column:
                    "RecipientUserId",
                principalTable:
                    "Users",
                principalColumn:
                    "Id",
                onDelete:
                    ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name:
                    "FK_Projects_Users_ProjectManagerId",
                table:
                    "Projects",
                column:
                    "ProjectManagerId",
                principalTable:
                    "Users",
                principalColumn:
                    "Id",
                onDelete:
                    ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name:
                    "FK_Comments_Users_RecipientUserId",
                table:
                    "Comments");

            migrationBuilder.DropForeignKey(
                name:
                    "FK_Projects_Users_ProjectManagerId",
                table:
                    "Projects");

            migrationBuilder.DropTable(
                name:
                    "ProjectMessages");

            migrationBuilder.DropIndex(
                name:
                    "IX_Projects_ProjectManagerId",
                table:
                    "Projects");

            migrationBuilder.DropIndex(
                name:
                    "IX_Comments_RecipientUserId",
                table:
                    "Comments");

            migrationBuilder.DropColumn(
                name:
                    "ProjectManagerId",
                table:
                    "Projects");

            migrationBuilder.DropColumn(
                name:
                    "RecipientUserId",
                table:
                    "Comments");

            migrationBuilder.AlterColumn<Guid>(
                name:
                    "DepartmentId",
                table:
                    "Projects",
                type:
                    "uniqueidentifier",
                nullable:
                    true,
                oldClrType:
                    typeof(Guid),
                oldType:
                    "uniqueidentifier");

            migrationBuilder.AlterColumn<string>(
                name:
                    "Content",
                table:
                    "Comments",
                type:
                    "nvarchar(max)",
                nullable:
                    false,
                oldClrType:
                    typeof(string),
                oldType:
                    "nvarchar(2000)",
                oldMaxLength:
                    2000);
        }
    }
}