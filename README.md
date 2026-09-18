# HewesoFlow

HewesoFlow is a web-based **Project and Task Management System** developed to manage projects, teams, departments, tasks, notifications, meetings, and project workflows through a centralized platform.

The application was developed with a **Clean Architecture** approach using ASP.NET Core and Next.js.

## Features

- Role-based authentication and authorization
- Admin, Project Manager and Team Member roles
- Role-based dashboards
- Project creation and management
- Department management
- Project member management
- Task assignment and tracking
- Task priorities and status management
- Project completion approval workflow
- Notifications
- Project messaging
- Meeting management
- Task attachments
- Comments and task history
- Reports and workload tracking
- Global search
- Light and dark appearance settings

## User Roles

### Admin

Administrators can manage the overall system, including users, departments, projects and project managers. The Admin dashboard provides an overview of system-wide project and task information.

### Project Manager

Project Managers can manage their assigned projects, project members and tasks. They have a dedicated dashboard for monitoring the projects and tasks under their responsibility.

### Team Member

Team Members can access the projects they participate in, view assigned tasks, update task progress and follow project-related activities.

## Technologies

### Backend

- ASP.NET Core Web API
- .NET 9
- Entity Framework Core
- SQL Server
- JWT Authentication
- REST API
- Clean Architecture

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React

### Development & Testing

- Swagger / OpenAPI
- Entity Framework Core Migrations
- Git & GitHub

## Architecture

The backend follows a Clean Architecture structure:

```text
src/
├── HewesoFlow.Api
├── HewesoFlow.Application
├── HewesoFlow.Domain
├── HewesoFlow.Infrastructure
└── HewesoFlow.Persistence