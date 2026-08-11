using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HewesoFlow.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectTasksModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndedAt",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "IsPaused",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "IsRunning",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "PausedAt",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "ResumedAt",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "TotalWorkedMinutes",
                table: "TaskTimeLogs");

            migrationBuilder.RenameColumn(
                name: "StartedAt",
                table: "TaskTimeLogs",
                newName: "WorkDate");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TaskTimeLogs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Hours",
                table: "TaskTimeLogs",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ProjectTasks",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedUserId",
                table: "ProjectTasks",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ProjectTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedHours",
                table: "ProjectTasks",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Projects",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "Hours",
                table: "TaskTimeLogs");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "EstimatedHours",
                table: "ProjectTasks");

            migrationBuilder.RenameColumn(
                name: "WorkDate",
                table: "TaskTimeLogs",
                newName: "StartedAt");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndedAt",
                table: "TaskTimeLogs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaused",
                table: "TaskTimeLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRunning",
                table: "TaskTimeLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PausedAt",
                table: "TaskTimeLogs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResumedAt",
                table: "TaskTimeLogs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalWorkedMinutes",
                table: "TaskTimeLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ProjectTasks",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedUserId",
                table: "ProjectTasks",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);
        }
    }
}
